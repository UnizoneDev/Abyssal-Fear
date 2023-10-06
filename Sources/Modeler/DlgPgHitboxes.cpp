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

// DlgPgHitboxes.cpp : implementation file
//

#include "stdafx.h"

#ifdef _DEBUG
#undef new
#define new DEBUG_NEW
#undef THIS_FILE
static char THIS_FILE[] = __FILE__;
#endif

/////////////////////////////////////////////////////////////////////////////
// CDlgPgHitboxes property page

IMPLEMENT_DYNCREATE(CDlgPgHitboxes, CPropertyPage)

CDlgPgHitboxes::CDlgPgHitboxes() : CPropertyPage(CDlgPgHitboxes::IDD)
{
    //{{AFX_DATA_INIT(CDlgPgHitboxes)
    m_fWidthHitBox = 0.0f;
    m_fHeightHitBox = 0.0f;
    m_fLenghtHitBox = 0.0f;
    m_fXCenterHitBox = 0.0f;
    m_fYDownHitBox = 0.0f;
    m_fZCenterHitBox = 0.0f;
    m_EqualityRadioHitBox = -1;
    m_strHitBoxName = _T("");
    m_strHitBoxIndex = _T("");
    m_bHitBoxAsBox = FALSE;
    //}}AFX_DATA_INIT

    theApp.m_pPgInfoHitboxes = this;
}

CDlgPgHitboxes::~CDlgPgHitboxes()
{
}

void CDlgPgHitboxes::DoDataExchange(CDataExchange* pDX)
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();

    // if transfering data from document to dialog
    if (!pDX->m_bSaveAndValidate)
    {
        // get hit min vector
        FLOAT3D vMinHitBox = pDoc->m_emEditModel.GetHitBoxMin();
        // get hit max vector
        FLOAT3D vMaxHitBox = pDoc->m_emEditModel.GetHitBoxMax();

        FLOATaabbox3D bboxHitbox = FLOATaabbox3D(vMinHitBox, vMaxHitBox);

        m_fWidthHitBox = bboxHitbox.Size()(1);
        m_fHeightHitBox = bboxHitbox.Size()(2);
        m_fLenghtHitBox = bboxHitbox.Size()(3);
        m_fXCenterHitBox = bboxHitbox.Center()(1);
        m_fYDownHitBox = vMinHitBox(2);
        m_fZCenterHitBox = bboxHitbox.Center()(3);

        // set equality radio initial value
        INDEX iEqualityType = pDoc->m_emEditModel.GetHitBoxDimensionEquality();

        // get index of curently selected hit box
        char achrString[256];
        sprintf(achrString, "%d.", pDoc->m_emEditModel.GetActiveHitBoxIndex());
        m_strHitBoxIndex = achrString;
        // get name of curently selected hit box
        sprintf(achrString, "%s", pDoc->m_emEditModel.GetHitBoxName());
        m_strHitBoxName = achrString;

        // enable all controls
        GetDlgItem(IDC_STATIC_WIDTH_HITBOX)->EnableWindow(TRUE);
        GetDlgItem(IDC_EDIT_WIDTH_HITBOX)->EnableWindow(TRUE);
        GetDlgItem(IDC_STATIC_HEIGHT_HITBOX)->EnableWindow(TRUE);
        GetDlgItem(IDC_EDIT_HEIGHT_HITBOX)->EnableWindow(TRUE);
        GetDlgItem(IDC_STATIC_LENGHT_HITBOX)->EnableWindow(TRUE);
        GetDlgItem(IDC_EDIT_LENGHT_HITBOX)->EnableWindow(TRUE);

        m_bHitBoxAsBox = pDoc->m_emEditModel.edm_md.md_bHitBoxAsCube;

        // if we are detecting hits using sphere approximation
        switch (iEqualityType)
        {
        case HEIGHT_EQ_WIDTH:
        {
            m_EqualityRadioHitBox = 0;
            if (!m_bHitBoxAsBox)
            {
                GetDlgItem(IDC_STATIC_HEIGHT_HITBOX)->EnableWindow(FALSE);
                GetDlgItem(IDC_EDIT_HEIGHT_HITBOX)->EnableWindow(FALSE);
                m_fHeightHitBox = m_fWidthHitBox;
            }
            break;
        }
        case LENGTH_EQ_WIDTH:
        {
            m_EqualityRadioHitBox = 1;
            if (!m_bHitBoxAsBox)
            {
                GetDlgItem(IDC_STATIC_LENGHT_HITBOX)->EnableWindow(FALSE);
                GetDlgItem(IDC_EDIT_LENGHT_HITBOX)->EnableWindow(FALSE);
                m_fLenghtHitBox = m_fWidthHitBox;
            }
            break;
        }
        case LENGTH_EQ_HEIGHT:
        {
            m_EqualityRadioHitBox = 2;
            if (!m_bHitBoxAsBox)
            {
                GetDlgItem(IDC_STATIC_LENGHT_HITBOX)->EnableWindow(FALSE);
                GetDlgItem(IDC_EDIT_LENGHT_HITBOX)->EnableWindow(FALSE);
                m_fLenghtHitBox = m_fHeightHitBox;
            }
            break;
        }
        default:
        {
            ASSERTALWAYS("None of hit dimensions are the same and that can't be.");
        }
        }
        // mark that the values have been updated to reflect the state of the view
        m_udAllValues.MarkUpdated();
    }

    CPropertyPage::DoDataExchange(pDX);
    //{{AFX_DATA_MAP(CDlgPgHitboxes)
    DDX_SkyFloat(pDX, IDC_EDIT_WIDTH_HITBOX, m_fWidthHitBox);
    DDX_SkyFloat(pDX, IDC_EDIT_HEIGHT_HITBOX, m_fHeightHitBox);
    DDX_SkyFloat(pDX, IDC_EDIT_LENGHT_HITBOX, m_fLenghtHitBox);
    DDX_SkyFloat(pDX, IDC_EDIT_XCENTER_HITBOX, m_fXCenterHitBox);
    DDX_SkyFloat(pDX, IDC_EDIT_YDOWN_HITBOX, m_fYDownHitBox);
    DDX_SkyFloat(pDX, IDC_EDIT_ZCENTER_HITBOX, m_fZCenterHitBox);
    DDX_Radio(pDX, IDC_H_EQ_W_HITBOX, m_EqualityRadioHitBox);
    DDX_Text(pDX, IDC_HIT_BOX_NAME, m_strHitBoxName);
    DDX_Text(pDX, IDC_HIT_BOX_INDEX, m_strHitBoxIndex);
    DDX_Check(pDX, IDC_HITBOX_AS_BOX, m_bHitBoxAsBox);
    //}}AFX_DATA_MAP

  // if transfering data from dialog to document
    if (pDX->m_bSaveAndValidate)
    {
      // if we are colliding using sphere approximation
      if (!pDoc->m_emEditModel.edm_md.md_bHitBoxAsCube)
      {
        INDEX iEqualityType;
        switch (m_EqualityRadioHitBox)
          {
          case 0:
          {
              iEqualityType = HEIGHT_EQ_WIDTH;
              CString strWidth;
              GetDlgItem(IDC_EDIT_WIDTH_HITBOX)->GetWindowText(strWidth);
              GetDlgItem(IDC_EDIT_HEIGHT_HITBOX)->SetWindowText(strWidth);
              break;
          }
          case 1:
          {
              iEqualityType = LENGTH_EQ_WIDTH;
              CString strWidth;
              GetDlgItem(IDC_EDIT_WIDTH_HITBOX)->GetWindowText(strWidth);
              GetDlgItem(IDC_EDIT_LENGHT_HITBOX)->SetWindowText(strWidth);
              break;
          }
          case 2:
          {
              iEqualityType = LENGTH_EQ_HEIGHT;
              CString strHeight;
              GetDlgItem(IDC_EDIT_HEIGHT_HITBOX)->GetWindowText(strHeight);
              GetDlgItem(IDC_EDIT_LENGHT_HITBOX)->SetWindowText(strHeight);
              break;
          }
          default:
          {
              ASSERTALWAYS("Illegal value found in hit detection dimensions equality radio.");
          }
        }
        // set hit equality value
        if (pDoc->m_emEditModel.GetHitBoxDimensionEquality() != iEqualityType)
        {
            pDoc->m_emEditModel.SetHitBoxDimensionEquality(iEqualityType);
        }
      }

        // set name of curently selected hit box
        pDoc->m_emEditModel.SetHitBoxName(CTString(CStringA(m_strHitBoxName)));

        // get hit min and max vectors
        FLOAT3D vMinHitBox;
        FLOAT3D vMaxHitBox;
        // get sizing values
        vMinHitBox(1) = m_fXCenterHitBox - m_fWidthHitBox / 2.0f;
        vMinHitBox(2) = m_fYDownHitBox;
        vMinHitBox(3) = m_fZCenterHitBox - m_fLenghtHitBox / 2.0f;
        // get origin coordinates
        vMaxHitBox(1) = m_fXCenterHitBox + m_fWidthHitBox / 2.0f;
        vMaxHitBox(2) = m_fYDownHitBox + m_fHeightHitBox;
        vMaxHitBox(3) = m_fZCenterHitBox + m_fLenghtHitBox / 2.0f;

        // transfer data from dialog to document
        pDoc->m_emEditModel.SetHitBox(vMinHitBox, vMaxHitBox);

        pDoc->SetModifiedFlag();
        // update all views
        pDoc->UpdateAllViews(NULL);
    }
}


BEGIN_MESSAGE_MAP(CDlgPgHitboxes, CPropertyPage)
    //{{AFX_MSG_MAP(CDlgPgHitboxes)
    ON_EN_CHANGE(IDC_EDIT_WIDTH, OnChangeEditWidthHitBox)
    ON_EN_CHANGE(IDC_EDIT_HEIGHT, OnChangeEditHeightHitBox)
    ON_EN_CHANGE(IDC_EDIT_LENGHT, OnChangeEditLenghtHitBox)
    ON_EN_CHANGE(IDC_EDIT_XCENTER, OnChangeEditXCenterHitBox)
    ON_EN_CHANGE(IDC_EDIT_YDOWN, OnChangeEditYDownHitBox)
    ON_EN_CHANGE(IDC_EDIT_ZCENTER, OnChangeEditZCenterHitBox)
    ON_BN_CLICKED(IDC_H_EQ_W, OnHEqWHitBox)
    ON_BN_CLICKED(IDC_L_EQ_W, OnLEqWHitBox)
    ON_BN_CLICKED(IDC_L_EQ_H, OnLEqHHitBox)
    ON_BN_CLICKED(IDC_ADD_HIT_BOX, OnAddHitBox)
    ON_EN_CHANGE(IDC_HIT_BOX_NAME, OnChangeHitBoxName)
    ON_BN_CLICKED(IDC_NEXT_HIT_BOX, OnNextHitBox)
    ON_BN_CLICKED(IDC_PREVIOUS_HIT_BOX, OnPreviousHitBox)
    ON_BN_CLICKED(IDC_REMOVE_HIT_BOX, OnRemoveHitBox)
    ON_BN_CLICKED(IDC_HITBOX_AS_BOX, OnHitBoxAsBox)
    ON_BN_CLICKED(IDC_ALLIGN_TO_SIZE, OnAllignToSizeHitBox)
    //}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CDlgPgHitboxes message handlers

BOOL CDlgPgHitboxes::OnIdle(LONG lCount)
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    ASSERT(pModelerView != NULL);

    // update data
    if (!theApp.m_chGlobal.IsUpToDate(m_udAllValues))
    {
        UpdateData(FALSE);
    }
    return TRUE;
}

BOOL _bAvoidingLoopingHitbox = FALSE;
void CDlgPgHitboxes::OnChangeEditWidthHitBox()
{
    if (!_bAvoidingLoopingHitbox)
    {
        _bAvoidingLoopingHitbox = TRUE;
        UpdateData(TRUE);
        //UpdateData(FALSE);
        _bAvoidingLoopingHitbox = FALSE;
    }
}

void CDlgPgHitboxes::OnChangeEditHeightHitBox()
{
    if (!_bAvoidingLoopingHitbox)
    {
        _bAvoidingLoopingHitbox = TRUE;
        UpdateData(TRUE);
        //UpdateData(FALSE);
        _bAvoidingLoopingHitbox = FALSE;
    }
}

void CDlgPgHitboxes::OnChangeEditLenghtHitBox()
{
    if (!_bAvoidingLoopingHitbox)
    {
        _bAvoidingLoopingHitbox = TRUE;
        UpdateData(TRUE);
        //UpdateData(FALSE);
        _bAvoidingLoopingHitbox = FALSE;
    }
}

void CDlgPgHitboxes::OnChangeEditXCenterHitBox()
{
    UpdateData(TRUE);
    //UpdateData(FALSE);
}

void CDlgPgHitboxes::OnChangeEditYDownHitBox()
{
    UpdateData(TRUE);
    //UpdateData(FALSE);
}

void CDlgPgHitboxes::OnChangeEditZCenterHitBox()
{
    UpdateData(TRUE);
    //UpdateData(FALSE);
}

void CDlgPgHitboxes::OnHEqWHitBox()
{
    m_EqualityRadioHitBox = 0;
    UpdateData(TRUE);
    UpdateData(FALSE);
}

void CDlgPgHitboxes::OnLEqWHitBox()
{
    m_EqualityRadioHitBox = 1;
    UpdateData(TRUE);
    UpdateData(FALSE);
}

void CDlgPgHitboxes::OnLEqHHitBox()
{
    m_EqualityRadioHitBox = 2;
    UpdateData(TRUE);
    UpdateData(FALSE);
}

void CDlgPgHitboxes::OnChangeHitBoxName()
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();
    // document has been changed
    pDoc->SetModifiedFlag();
    UpdateData(TRUE);
}

void CDlgPgHitboxes::OnNextHitBox()
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();
    pDoc->m_emEditModel.ActivateNextHitBox();
    UpdateData(FALSE);
    // update all views
    pDoc->UpdateAllViews(NULL);
}

void CDlgPgHitboxes::OnPreviousHitBox()
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();
    pDoc->m_emEditModel.ActivatePreviousHitBox();
    UpdateData(FALSE);
    // update all views
    pDoc->UpdateAllViews(NULL);
}

void CDlgPgHitboxes::OnAddHitBox()
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();
    pDoc->m_emEditModel.AddHitBox();
    UpdateData(FALSE);

    // document has been changed
    pDoc->SetModifiedFlag();
    // update all views
    pDoc->UpdateAllViews(NULL);
}

void CDlgPgHitboxes::OnRemoveHitBox()
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();
    pDoc->m_emEditModel.DeleteCurrentHitBox();
    UpdateData(FALSE);

    // document has been changed
    pDoc->SetModifiedFlag();
    // update all views
    pDoc->UpdateAllViews(NULL);
}

void CDlgPgHitboxes::OnHitBoxAsBox()
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();
    pDoc->m_emEditModel.edm_md.md_bHitBoxAsCube = !pDoc->m_emEditModel.edm_md.md_bHitBoxAsCube;
    UpdateData(TRUE);
    UpdateData(FALSE);
    pDoc->SetModifiedFlag();
    pDoc->UpdateAllViews(NULL);
}

void CDlgPgHitboxes::OnAllignToSizeHitBox()
{
    CModelerView* pModelerView = CModelerView::GetActiveView();
    if (pModelerView == NULL) return;
    CModelerDoc* pDoc = pModelerView->GetDocument();
    FLOATaabbox3D MaxBB;
    pDoc->m_emEditModel.edm_md.GetAllFramesBBox(MaxBB);
    pDoc->m_emEditModel.SetHitBox(MaxBB.Min(), MaxBB.Max());
    UpdateData(FALSE);
    pDoc->SetModifiedFlag();
    pDoc->UpdateAllViews(NULL);
}
