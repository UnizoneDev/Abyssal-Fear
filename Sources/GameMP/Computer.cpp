/* Copyright (c) 2002-2012 Croteam Ltd. 
This program is free software; you can redistribute it and/or modify
it under the terms of version 2 of the GNU General Public License as published by
the Free Software Foundation


This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. */

#include "StdAfx.h"
#include "LCDDrawing.h"
#include "CompMessage.h"

extern CGame *_pGame;

static const FLOAT tmComputerFade   = 1.0f;  // how many seconds it takes computer to fade in/out
static FLOAT fComputerFadeValue     = 0.0f;  // faded value of computer (0..1)
static CTimerValue tvComputerLast;
static CTimerValue _tvMessageAppear;
static CPlayer *_ppenPlayer = NULL;
extern FLOAT _fMsgAppearFade = 0.0f;
extern FLOAT _fMsgAppearDelta = 0.0f;

// player statistics are set here
extern CTString _strStatsDetails = "";

// mouse cursor position
static PIX2D _vpixMouse;
static PIX2D _vpixExternMouse;
static PIX _pixSliderDragJ = -1;
static PIX _iSliderDragLine = -1;
static PIX _bSliderDragText = FALSE;
// font metrics
static PIX _pixCharSizeI = 1;
static PIX _pixCharSizeJ = 1;
static PIX _pixCharSize2I = 1;
static PIX _pixCharSize2J = 1;

static PIX _pixMarginI = 1;
static PIX _pixMarginJ = 1;
// general geometry data
static FLOAT _fScaling = 1;
static FLOAT _fScaling2 = 1;
static PIX _pixSizeI=0;
static PIX _pixSizeJ=0;
static PIXaabbox2D _boxTitle;
static PIXaabbox2D _boxExit;
static PIXaabbox2D _boxMsgList;
static PIXaabbox2D _boxMsgText;
static PIXaabbox2D _boxMsgImage;
static PIXaabbox2D _boxButton[CMT_COUNT];
static INDEX _ctMessagesOnScreen = 5;
static INDEX _ctTextLinesOnScreen = 20;
static INDEX _ctTextCharsPerRow = 20;

// position of the message list
static INDEX _iFirstMessageOnScreen = -1;
static INDEX _iWantedFirstMessageOnScreen = 0;
static INDEX _iLastActiveMessage = -1;
static INDEX _iActiveMessage = 0;

// message type selected in the buttons list
static enum CompMsgType _cmtCurrentType = (enum CompMsgType)-1;
static enum CompMsgType _cmtWantedType = CMT_INFORMATION;

// current scroll position of message text
static INDEX _iTextLineOnScreen = 0;

// message list cache for messages of current type
static CStaticStackArray<CCompMessage> _acmMessages;

// message image data
static CTextureObject _toPicture;

// text/graphics colors
static COLOR _colLight;
static COLOR _colMedium;
static COLOR _colDark;
static COLOR _colBoxes;

static void SetFont1(CDrawPort *pdp)
{
  pdp->SetFont(_pfdConsoleFont);
  pdp->SetTextScaling(_fScaling);
  pdp->SetTextAspect(1.0f);
}

static void SetFont2(CDrawPort *pdp)
{
  pdp->SetFont(_pfdDisplayFont);
  pdp->SetTextScaling(_fScaling2);
  pdp->SetTextAspect(1.0f);
}

static COLOR MouseOverColor(const PIXaabbox2D &box, COLOR colNone,
                            COLOR colOff, COLOR colOn)
{
  if (box>=_vpixMouse) {
    return LCDBlinkingColor(colOff, colOn);
  } else {
    return colNone;
  }
}

static PIXaabbox2D GetMsgListBox(INDEX i)
{
  PIX pixI0 = _boxMsgList.Min()(1)+_pixMarginI;
  PIX pixI1 = _boxMsgList.Max()(1)-_pixMarginI*3;
  PIX pixJ0 = _boxMsgList.Min()(2)+_pixMarginJ;
  PIX pixDJ = _pixCharSizeJ;
  return PIXaabbox2D(
    PIX2D(pixI0, pixJ0+pixDJ*i),
    PIX2D(pixI1, pixJ0+pixDJ*(i+1)-1));
}

static PIXaabbox2D GetSliderBox(INDEX iFirst, INDEX iVisible, INDEX iTotal,
  PIXaabbox2D boxFull)
{
  FLOAT fSize = ClampUp(FLOAT(iVisible)/iTotal, 1.0f);
  PIX pixFull = boxFull.Size()(2);
  PIX pixSize = PIX(pixFull*fSize);
  pixSize = ClampDn(pixSize, boxFull.Size()(1));
  PIX pixTop = pixFull*(FLOAT(iFirst)/iTotal)+boxFull.Min()(2);
  PIX pixI0 = boxFull.Min()(1);
  PIX pixI1 = boxFull.Max()(1);
  return PIXaabbox2D(PIX2D(pixI0, pixTop), PIX2D(pixI1, pixTop+pixSize));
}

static INDEX SliderPixToIndex(PIX pixOffset, INDEX iVisible, INDEX iTotal, PIXaabbox2D boxFull)
{
  FLOAT fSize = ClampUp(FLOAT(iVisible)/iTotal, 1.0f);
  PIX pixFull = boxFull.Size()(2);
  PIX pixSize = PIX(pixFull*fSize);
  if (pixSize>=boxFull.Size()(2)) {
    return 0;
  }
  return (iTotal*pixOffset)/pixFull;
}

static PIXaabbox2D GetTextSliderSpace(void)
{
  PIX pixSizeI = _boxMsgText.Size()(1);
  PIX pixSizeJ = _boxMsgText.Size()(2);

  PIX pixSliderSizeI = _pixMarginI*2;
  if (pixSliderSizeI<5) {
    pixSliderSizeI=5;
  }
  return PIXaabbox2D(
    PIX2D(pixSizeI-pixSliderSizeI, _pixMarginJ*4),
    PIX2D(pixSizeI, pixSizeJ));
}

static PIXaabbox2D GetMsgSliderSpace(void)
{
  PIX pixSizeI = _boxMsgList.Size()(1);
  PIX pixSizeJ = _boxMsgList.Size()(2);

  PIX pixSliderSizeI = _pixMarginI*2;
  if (pixSliderSizeI<5) {
    pixSliderSizeI=5;
  }
  return PIXaabbox2D(
    PIX2D(pixSizeI-pixSliderSizeI, 0),
    PIX2D(pixSizeI, pixSizeJ));
}

static PIXaabbox2D GetTextSliderBox(void)
{
  if (_iActiveMessage>=_acmMessages.Count()) {
    return PIXaabbox2D();
  }
  INDEX ctTextLines = _acmMessages[_iActiveMessage].cm_ctFormattedLines;
  PIX pixSizeI = _boxMsgText.Size()(1);
  PIX pixSizeJ = _boxMsgText.Size()(2);
  return GetSliderBox(
    _iTextLineOnScreen, _ctTextLinesOnScreen, ctTextLines, GetTextSliderSpace());
}

static PIXaabbox2D GetMsgSliderBox(void)
{
  INDEX ctLines = _acmMessages.Count();
  PIX pixSizeI = _boxMsgList.Size()(1);
  PIX pixSizeJ = _boxMsgList.Size()(2);
  return GetSliderBox(
    _iFirstMessageOnScreen, _ctMessagesOnScreen, ctLines, GetMsgSliderSpace());
}

// syncronize message list scrolling to show active message
void SyncScrollWithActive(void)
{
  if (_iActiveMessage<_iFirstMessageOnScreen) {
    _iWantedFirstMessageOnScreen = _iActiveMessage;
  }
  if (_iActiveMessage>_iFirstMessageOnScreen+_ctMessagesOnScreen-1) {
    _iWantedFirstMessageOnScreen = _iActiveMessage-_ctMessagesOnScreen+1;
  }
}

// select next unread message
static void NextUnreadMessage(void)
{
  INDEX i=_iActiveMessage;
  FOREVER {
    i++;
    if (i>=_acmMessages.Count()) {
      i = 0;
    }
    if (i==_iActiveMessage) {
      return;
    }
    if (!_acmMessages[i].cm_bRead) {
      _iActiveMessage = i;
      SyncScrollWithActive();
      return;
    }
  }
}

// update scroll position for message list
static void UpdateFirstOnScreen(void)
{
  if (_iFirstMessageOnScreen==_iWantedFirstMessageOnScreen) {
    return;
  }
  _iFirstMessageOnScreen=_iWantedFirstMessageOnScreen;
  ASSERT(
    _iFirstMessageOnScreen>=0&&
    _iFirstMessageOnScreen<=_acmMessages.Count());
  _iFirstMessageOnScreen = Clamp(_iFirstMessageOnScreen, INDEX(0), _acmMessages.Count());

  // for each message
  for(INDEX i=0; i<_acmMessages.Count(); i++) {
    CCompMessage &cm = _acmMessages[i];
    // if on screen
    if (i>=_iWantedFirstMessageOnScreen
      &&i<_iWantedFirstMessageOnScreen+_ctMessagesOnScreen) {
      // load
      cm.PrepareMessage(_ctTextCharsPerRow);
    // if not on screen
    } else {
      // unload
      cm.UnprepareMessage();
    }
  }
}

static void UpdateMessageAppearing(void)
{
  if (_iLastActiveMessage!=_iActiveMessage) {
    _pShell->Execute("FreeUnusedStock();");   // make sure user doesn't overflow memory
    _iTextLineOnScreen = 0;
    _iLastActiveMessage=_iActiveMessage;
    _tvMessageAppear = _pTimer->GetHighPrecisionTimer();
  }
  CTimerValue tvNow = _pTimer->GetHighPrecisionTimer();
  _fMsgAppearDelta = (tvNow-_tvMessageAppear).GetSeconds();

  if (fComputerFadeValue<0.99f) {
    _tvMessageAppear = _pTimer->GetHighPrecisionTimer();
    _fMsgAppearDelta = 0.0f;
  }
  _fMsgAppearFade = Clamp(_fMsgAppearDelta/0.5f, 0.0f,1.0f);
}

// update screen geometry
static void UpdateSize(CDrawPort *pdp)
{
  // get screen size
  PIX pixSizeI = pdp->GetWidth();
  PIX pixSizeJ = pdp->GetHeight();

  // remember new size
  _pixSizeI = pixSizeI;
  _pixSizeJ = pixSizeJ;

  // determine scaling
  _fScaling = 1.0f;
  _fScaling2 = 1.0f;
  if (pixSizeJ<384) {
    _fScaling = 1.0f;
    _fScaling2 = pixSizeJ/480.0f;
  }

  // remember font size
  CFontData *pfd = _pfdConsoleFont;
  _pixCharSizeI = pfd->fd_pixCharWidth  + pfd->fd_pixCharSpacing;
  _pixCharSizeJ = pfd->fd_pixCharHeight + pfd->fd_pixLineSpacing;
  _pixCharSize2I = _pixCharSizeI*_fScaling2;
  _pixCharSize2J = _pixCharSizeJ*_fScaling2;
  _pixCharSizeI = _pixCharSizeI*_fScaling;
  _pixCharSizeJ = _pixCharSizeJ*_fScaling;

  _pixMarginI = 5*_fScaling2;
  _pixMarginJ = 5*_fScaling2;
  PIX pixBoxMarginI = 10*_fScaling2;
  PIX pixBoxMarginJ = 10*_fScaling2;

  PIX pixJ0Dn = pixBoxMarginJ;
  PIX pixJ1Up = pixJ0Dn+_pixCharSize2J+_pixMarginI*2;
  PIX pixJ1Dn = pixJ1Up+pixBoxMarginJ;
  PIX pixJ2Up = pixJ1Dn+_pixCharSize2J*6*2+pixBoxMarginJ;
  PIX pixJ2Dn = pixJ2Up+pixBoxMarginJ;
  PIX pixJ3Up = _pixSizeJ-pixBoxMarginJ;

  PIX pixI0Rt = pixBoxMarginI;
  PIX pixI1Lt = pixI0Rt+_pixCharSize2I*20+pixBoxMarginI;
  PIX pixI1Rt = pixI1Lt+pixBoxMarginI;
  PIX pixI2Lt = _pixSizeI/2-pixBoxMarginI/2;
  PIX pixI2Rt = _pixSizeI/2+pixBoxMarginI/2;
  PIX pixI4Lt = _pixSizeI-pixBoxMarginI;
  PIX pixI3Rt = pixI4Lt-pixBoxMarginI*2-_pixCharSize2I*10;
  PIX pixI3Lt = pixI3Rt-pixBoxMarginI;

  // calculate box sizes
  _boxTitle = PIXaabbox2D( PIX2D(0, pixJ0Dn-1), PIX2D(pixI3Lt, pixJ1Up));
  _boxExit  = PIXaabbox2D( PIX2D( pixI3Rt, pixJ0Dn-1), PIX2D(_pixSizeI, pixJ1Up));
  PIX pixD = 5;
  PIX pixH = (pixJ2Up-pixJ1Dn-pixD*(CMT_COUNT-1))/CMT_COUNT;
  INDEX i;
  for( i=0; i<CMT_COUNT; i++) {
    _boxButton[i] = PIXaabbox2D( 
      PIX2D(0,       pixJ1Dn+(pixH+pixD)*i),
      PIX2D(pixI1Lt, pixJ1Dn+(pixH+pixD)*i+pixH));
  }
  _boxMsgList = PIXaabbox2D( PIX2D(pixI1Rt, pixJ1Dn), PIX2D(pixI4Lt, pixJ2Up));

  if (GetSP()->sp_bCooperative) {
    _boxMsgText = PIXaabbox2D( PIX2D(pixI2Rt, pixJ2Dn), PIX2D(pixI4Lt, pixJ3Up));
    _boxMsgImage= PIXaabbox2D( PIX2D(pixI0Rt, pixJ2Dn), PIX2D(pixI2Lt, pixJ3Up));
  } else {
    _boxMsgText = PIXaabbox2D( PIX2D(pixI0Rt, pixJ2Dn), PIX2D(pixI4Lt, pixJ3Up));
    _boxMsgImage= PIXaabbox2D();
  }

  FLOAT fSlideSpeed = Max(_pixSizeI, _pixSizeJ*2L);
  FLOAT fGroup0 = ClampDn((1-fComputerFadeValue)*fSlideSpeed-_pixSizeJ, 0.0f);
  FLOAT fGroup1 = (1-fComputerFadeValue)*fSlideSpeed;
  // animate box positions
  _boxTitle -= PIX2D( fGroup1, 0);
  _boxExit  += PIX2D( fGroup1, 0);
  for( i=0; i<CMT_COUNT; i++) {
    FLOAT fOffs = ClampDn(fGroup1-(CMT_COUNT-i)*_pixMarginJ*10, 0.0f);
    _boxButton[i] -= PIX2D(fOffs, 0);
  }
  _boxMsgList -= PIX2D(0, fGroup0);
  _boxMsgText += PIX2D(fGroup0, 0);
  _boxMsgImage+= PIX2D(0, fGroup0);
  _ctMessagesOnScreen  = (_boxMsgList.Size()(2) - _pixMarginJ*2)                 / _pixCharSizeJ;
  _ctTextCharsPerRow   = (_boxMsgText.Size()(1) - _pixMarginI*4)                 / _pixCharSizeI;
  _ctTextLinesOnScreen = (_boxMsgText.Size()(2) - _pixMarginJ*2 - _pixMarginJ*4) / _pixCharSizeJ;
}


static char *_astrButtonTexts[CMT_COUNT];

// print message type buttons
void PrintButton(CDrawPort *pdp, INDEX iButton)
{
  CDrawPort dpButton(pdp, _boxButton[iButton]);
  if (!dpButton.Lock()) {
    return;
  } 
  LCDSetDrawport(&dpButton);
  LCDRenderClouds2();
  LCDScreenBoxOpenLeft(_colBoxes);

  SetFont2(&dpButton);

  // prepare color
  COLOR col = _colMedium;
  if (iButton==_cmtCurrentType) {
    col = _colLight;
  }
  col = MouseOverColor(_boxButton[iButton], col, _colDark, _colLight);

  // prepare string
  CTString str;
  str.PrintF("%s", _astrButtonTexts[iButton]);

  // print it
  dpButton.PutTextR( str, _boxButton[iButton].Size()(1)-_pixMarginI, _pixCharSize2J/2+1, col);

  dpButton.Unlock();
}

// print title
void PrintTitle(CDrawPort *pdp)
{
  SetFont2(pdp);
  CTString strTitle;
  strTitle.PrintF(TRANS("Inventory"));
  pdp->PutText( strTitle, _pixMarginI*3, _pixMarginJ-2*_fScaling2+1, _colMedium);
}

// print exit button
void PrintExit(CDrawPort *pdp)
{
  SetFont2(pdp);
  pdp->PutTextR( TRANS("Exit"), _boxExit.Size()(1)-_pixMarginI*3, _pixMarginJ-2*_fScaling2+1, 
    MouseOverColor(_boxExit, _colMedium, _colDark, _colLight));
}

// print list of messages
void PrintMessageList(CDrawPort *pdp)
{
  PIX pixTextX = _pixMarginI;
  PIX pixYLine = _pixMarginJ;
  SetFont1(pdp);

  INDEX iFirst = _iFirstMessageOnScreen;
  INDEX iLast = Min(INDEX(_iFirstMessageOnScreen+_ctMessagesOnScreen), _acmMessages.Count())-1;
  if (iFirst>iLast) {
    pdp->PutText( TRANS("no messages"), pixTextX, pixYLine, _colDark);
  }
  for(INDEX i=iFirst; i<=iLast; i++) {
    COLOR col = _colMedium;
    if (_acmMessages[i].cm_bRead) {
      col = _colDark;
    }
    if (i==_iActiveMessage) {
      col = _colLight;
    }
    if (GetMsgListBox(i-_iFirstMessageOnScreen)>=_vpixMouse) {
      col = LCDBlinkingColor(_colLight, _colMedium);
    }
    pdp->PutText( _acmMessages[i].cm_strSubject, pixTextX, pixYLine, col);
    pixYLine+=_pixCharSizeJ;
  }

  PIXaabbox2D boxSliderSpace = GetMsgSliderSpace();
  LCDDrawBox(0,0,boxSliderSpace, _colBoxes);
  PIXaabbox2D boxSlider = GetMsgSliderBox();
  COLOR col = _colBoxes;
  PIXaabbox2D boxSliderTrans = boxSlider;
  boxSliderTrans+=_boxMsgList.Min();
  if (boxSliderTrans>=_vpixMouse) {
    col = LCDBlinkingColor(_colLight, _colDark);
  }
  pdp->Fill( boxSlider.Min()(1)+2,  boxSlider.Min()(2)+2,
             boxSlider.Size()(1)-4, boxSlider.Size()(2)-4, col);
}

// print text of current message
void PrintMessageText(CDrawPort *pdp)
{
  if (_acmMessages.Count()==0 ||
      _iActiveMessage>=_acmMessages.Count()||
      fComputerFadeValue<0.99f) {
    return;
  }

  SetFont2(pdp);

  // print subject
  CTString strSubject0;
  CTString strSubject1;
  CTString strSubject2;
  //strSubject.PrintF("%g", _fMsgAppearFade);
  const char *strSubject = _acmMessages[_iActiveMessage].cm_strSubject;
  INDEX ctSubjectLen = strlen(strSubject);
  INDEX ctToPrint = int(_fMsgAppearDelta*20.0f);
  for (INDEX iChar=0; iChar<ctSubjectLen; iChar++) {
    char strChar[2];
    strChar[0] = strSubject[iChar];
    strChar[1] = 0;
    if (iChar>ctToPrint) {
      NOTHING;
    } else if (iChar==ctToPrint) {
      strSubject2+=strChar;
    } else if (iChar==ctToPrint-1) {
      strSubject1+=strChar;
    } else {
      strSubject0+=strChar;
    }
  }
  PIX pixWidth0 = pdp->GetTextWidth(strSubject0);
  PIX pixWidth1 = pdp->GetTextWidth(strSubject1);
  pdp->PutText(strSubject0, _pixMarginI, _pixMarginJ-1, _colMedium);
  pdp->PutText(strSubject1, _pixMarginI+pixWidth0, _pixMarginJ-1, LerpColor( _colLight, _colMedium, 0.5f));
  pdp->PutText(strSubject2, _pixMarginI+pixWidth0+pixWidth1, _pixMarginJ-1, _colLight);

  pdp->DrawLine(0, PIX(_pixMarginJ*4), _boxMsgText.Size()(1), PIX(_pixMarginJ*4), _colBoxes);

  // fill in fresh player statistics
  if (strncmp(_acmMessages[_iActiveMessage].cm_strText, "$STAT", 5)==0) {
    _ppenPlayer->GetStats(_strStatsDetails, CST_DETAIL, _ctTextCharsPerRow);
    _acmMessages[_iActiveMessage].cm_ctFormattedWidth = 0;
  }
  // format text
  _acmMessages[_iActiveMessage].PrepareMessage(_ctTextCharsPerRow);

  SetFont1(pdp);
  INDEX ctLineToPrint = int(_fMsgAppearDelta*20.0f);
  // print it
  PIX pixJ = _pixMarginJ*4;
  for (INDEX iLine = _iTextLineOnScreen; 
    iLine<_iTextLineOnScreen+_ctTextLinesOnScreen;
    iLine++) {
    INDEX iPrintLine = iLine-_iTextLineOnScreen;
    if (iPrintLine>ctLineToPrint) {
      continue;
    }
    COLOR col = LerpColor( _colLight, _colMedium, Clamp( FLOAT(ctLineToPrint-iPrintLine)/3, 0.0f, 1.0f));
    pdp->PutText(_acmMessages[_iActiveMessage].GetLine(iLine),
      _pixMarginI, pixJ, col);
    pixJ+=_pixCharSizeJ;
  }

  PIXaabbox2D boxSliderSpace = GetTextSliderSpace();
  LCDDrawBox(0,0,boxSliderSpace, _colBoxes);
  PIXaabbox2D boxSlider = GetTextSliderBox();
  COLOR col = _colBoxes;
  PIXaabbox2D boxSliderTrans = boxSlider;
  boxSliderTrans+=_boxMsgText.Min();
  if (boxSliderTrans>=_vpixMouse) {
    col = LCDBlinkingColor(_colLight, _colDark);
  }
  pdp->Fill( boxSlider.Min()(1)+2,  boxSlider.Min()(2)+2,
             boxSlider.Size()(1)-4, boxSlider.Size()(2)-4, col);
}

static void ExitRequested(void)
{
  // if end of game
  if (_ppenPlayer!=NULL && _ppenPlayer->m_bEndOfGame || _pNetwork->IsGameFinished()) {
    // if in single player
    if (GetSP()->sp_bSinglePlayer) {
      // request app to show high score
      _pShell->Execute("sam_bMenuHiScore=1;");
    }
    // stop current game
    _pGame->StopGame();
  // if not end of level
  }
  // turn off end of level for player
  if (_ppenPlayer!=NULL) {
    _ppenPlayer->m_bEndOfLevel = FALSE;
  }
}
