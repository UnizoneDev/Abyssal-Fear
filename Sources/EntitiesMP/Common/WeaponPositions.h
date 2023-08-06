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

 
#if 0 // use this part when manually setting weapon positions

  _pShell->DeclareSymbol("persistent user FLOAT wpn_fH[30+1];",    &wpn_fH);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fP[30+1];",    &wpn_fP);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fB[30+1];",    &wpn_fB);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fX[30+1];",    &wpn_fX);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fY[30+1];",    &wpn_fY);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fZ[30+1];",    &wpn_fZ);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fFOV[30+1];",  &wpn_fFOV);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fClip[30+1];", &wpn_fClip);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fFX[30+1];", &wpn_fFX);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fFY[30+1];", &wpn_fFY);
//_pShell->DeclareSymbol("persistent user FLOAT wpn_fFZ[30+1];", &wpn_fFZ);
#else
  /*
  _pShell->DeclareSymbol("user FLOAT wpn_fFX[30+1];", &wpn_fFX);
  _pShell->DeclareSymbol("user FLOAT wpn_fFY[30+1];", &wpn_fFY);
  */

#pragma warning(disable: 4305)


wpn_fH[0]=(FLOAT)10;
wpn_fH[1]=(FLOAT)8;
wpn_fH[WEAPON_KNIFE]=(FLOAT)5.5;
wpn_fH[WEAPON_AXE]=(FLOAT)6;
wpn_fH[WEAPON_PISTOL]=(FLOAT)10;
wpn_fH[WEAPON_SHOTGUN]=(FLOAT)10;
wpn_fH[WEAPON_SMG]=(FLOAT)17;
wpn_fH[WEAPON_PIPE]=(FLOAT)30;
wpn_fH[WEAPON_STRONGPISTOL]=(FLOAT)10;
wpn_fH[9]=(FLOAT)5;
wpn_fH[10]=(FLOAT)4.6;
wpn_fH[11]=(FLOAT)1;
wpn_fH[12]=(FLOAT)4;
wpn_fH[13]=(FLOAT)2.5;
wpn_fH[14]=(FLOAT)4;
wpn_fH[15]=(FLOAT)2.5;
wpn_fH[16]=(FLOAT)0;
wpn_fH[17]=(FLOAT)0;
wpn_fH[18]=(FLOAT)0;
wpn_fH[19]=(FLOAT)0;
wpn_fH[20]=(FLOAT)0;
wpn_fH[21]=(FLOAT)0;
wpn_fH[22]=(FLOAT)0;
wpn_fH[23]=(FLOAT)0;
wpn_fH[24]=(FLOAT)0;
wpn_fH[25]=(FLOAT)0;
wpn_fH[26]=(FLOAT)0;
wpn_fH[27]=(FLOAT)0;
wpn_fH[28]=(FLOAT)0;
wpn_fH[29]=(FLOAT)0;
wpn_fH[30]=(FLOAT)0;

wpn_fP[0]=(FLOAT)0;
wpn_fP[1]=(FLOAT)5;
wpn_fP[WEAPON_KNIFE]=(FLOAT)3;
wpn_fP[WEAPON_AXE]=(FLOAT)3;
wpn_fP[WEAPON_PISTOL]=(FLOAT)2;
wpn_fP[WEAPON_SHOTGUN]=(FLOAT)10;
wpn_fP[WEAPON_SMG]=(FLOAT)6.5;
wpn_fP[WEAPON_PIPE]=(FLOAT)10;
wpn_fP[WEAPON_STRONGPISTOL]=(FLOAT)2;
wpn_fP[9]=(FLOAT)6;
wpn_fP[10]=(FLOAT)2.8;
wpn_fP[11]=(FLOAT)3;
wpn_fP[12]=(FLOAT)2.5;
wpn_fP[13]=(FLOAT)6;
wpn_fP[14]=(FLOAT)0;
wpn_fP[15]=(FLOAT)6;
wpn_fP[16]=(FLOAT)0;
wpn_fP[17]=(FLOAT)0;
wpn_fP[18]=(FLOAT)0;
wpn_fP[19]=(FLOAT)0;
wpn_fP[20]=(FLOAT)0;
wpn_fP[21]=(FLOAT)0;
wpn_fP[22]=(FLOAT)0;
wpn_fP[23]=(FLOAT)0;
wpn_fP[24]=(FLOAT)0;
wpn_fP[25]=(FLOAT)0;
wpn_fP[26]=(FLOAT)0;
wpn_fP[27]=(FLOAT)0;
wpn_fP[28]=(FLOAT)0;
wpn_fP[29]=(FLOAT)0;
wpn_fP[30]=(FLOAT)0;

wpn_fB[0]=(FLOAT)0;
wpn_fB[1]=(FLOAT)3;
wpn_fB[WEAPON_KNIFE]=(FLOAT)3;
wpn_fB[WEAPON_AXE]=(FLOAT)3;
wpn_fB[WEAPON_PISTOL]=(FLOAT)10;
wpn_fB[WEAPON_SHOTGUN]=(FLOAT)20;
wpn_fB[WEAPON_SMG]=(FLOAT)0;
wpn_fB[WEAPON_PIPE]=(FLOAT)350;
wpn_fB[WEAPON_STRONGPISTOL]=(FLOAT)10;
wpn_fB[9]=(FLOAT)-1;
wpn_fB[10]=(FLOAT)0;
wpn_fB[11]=(FLOAT)0;
wpn_fB[12]=(FLOAT)-0.5;
wpn_fB[13]=(FLOAT)0;
wpn_fB[14]=(FLOAT)0;
wpn_fB[15]=(FLOAT)0;
wpn_fB[16]=(FLOAT)0;
wpn_fB[17]=(FLOAT)0;
wpn_fB[18]=(FLOAT)0;
wpn_fB[19]=(FLOAT)0;
wpn_fB[20]=(FLOAT)0;
wpn_fB[21]=(FLOAT)0;
wpn_fB[22]=(FLOAT)0;
wpn_fB[23]=(FLOAT)0;
wpn_fB[24]=(FLOAT)0;
wpn_fB[25]=(FLOAT)0;
wpn_fB[26]=(FLOAT)0;
wpn_fB[27]=(FLOAT)0;
wpn_fB[28]=(FLOAT)0;
wpn_fB[29]=(FLOAT)0;
wpn_fB[30]=(FLOAT)0;

wpn_fX[0]=(FLOAT)0.08;
wpn_fX[1]=(FLOAT)0.3;
wpn_fX[WEAPON_KNIFE]=(FLOAT)0.325;
wpn_fX[WEAPON_AXE]=(FLOAT)0.25;
wpn_fX[WEAPON_PISTOL]=(FLOAT)0.125;
wpn_fX[WEAPON_SHOTGUN]=(FLOAT)0.275;
wpn_fX[WEAPON_SMG]=(FLOAT)0.275;
wpn_fX[WEAPON_PIPE]=(FLOAT)0.25;
wpn_fX[WEAPON_STRONGPISTOL]=(FLOAT)0.125;
wpn_fX[9]=(FLOAT)0.125;
wpn_fX[10]=(FLOAT)0.204;
wpn_fX[11]=(FLOAT)0.141;
wpn_fX[12]=(FLOAT)0.095;
wpn_fX[13]=(FLOAT)0.17;
wpn_fX[14]=(FLOAT)0.169;
wpn_fX[15]=(FLOAT)0.225;
wpn_fX[16]=(FLOAT)0;
wpn_fX[17]=(FLOAT)0;
wpn_fX[18]=(FLOAT)0;
wpn_fX[19]=(FLOAT)0;
wpn_fX[20]=(FLOAT)0;
wpn_fX[21]=(FLOAT)0;
wpn_fX[22]=(FLOAT)0;
wpn_fX[23]=(FLOAT)0;
wpn_fX[24]=(FLOAT)0;
wpn_fX[25]=(FLOAT)0;
wpn_fX[26]=(FLOAT)0;
wpn_fX[27]=(FLOAT)0;
wpn_fX[28]=(FLOAT)0;
wpn_fX[29]=(FLOAT)0;
wpn_fX[30]=(FLOAT)0;

wpn_fY[0]=(FLOAT)0;
wpn_fY[1]=(FLOAT)-0.25;
wpn_fY[WEAPON_KNIFE]=(FLOAT)-0.25;
wpn_fY[WEAPON_AXE]=(FLOAT)-0.175;
wpn_fY[WEAPON_PISTOL]=(FLOAT)-0.2;
wpn_fY[WEAPON_SHOTGUN]=(FLOAT)-0.275;
wpn_fY[WEAPON_SMG]=(FLOAT)-0.25;
wpn_fY[WEAPON_PIPE]=(FLOAT)-0.25;
wpn_fY[WEAPON_STRONGPISTOL]=(FLOAT)-0.2;
wpn_fY[9]=(FLOAT)-0.29;
wpn_fY[10]=(FLOAT)-0.306;
wpn_fY[11]=(FLOAT)-0.174;
wpn_fY[12]=(FLOAT)-0.26;
wpn_fY[13]=(FLOAT)-0.3;
wpn_fY[14]=(FLOAT)-0.102;
wpn_fY[15]=(FLOAT)-0.345;
wpn_fY[16]=(FLOAT)0;
wpn_fY[17]=(FLOAT)0;
wpn_fY[18]=(FLOAT)0;
wpn_fY[19]=(FLOAT)0;
wpn_fY[20]=(FLOAT)0;
wpn_fY[21]=(FLOAT)0;
wpn_fY[22]=(FLOAT)0;
wpn_fY[23]=(FLOAT)0;
wpn_fY[24]=(FLOAT)0;
wpn_fY[25]=(FLOAT)0;
wpn_fY[26]=(FLOAT)0;
wpn_fY[27]=(FLOAT)0;
wpn_fY[28]=(FLOAT)0;
wpn_fY[29]=(FLOAT)0;
wpn_fY[30]=(FLOAT)0;

wpn_fZ[0]=(FLOAT)0;
wpn_fZ[1]=(FLOAT)-0.45;
wpn_fZ[WEAPON_KNIFE]=(FLOAT)-0.25;
wpn_fZ[WEAPON_AXE]=(FLOAT)-0.3;
wpn_fZ[WEAPON_PISTOL]=(FLOAT)-0.5;
wpn_fZ[WEAPON_SHOTGUN]=(FLOAT)-0.25;
wpn_fZ[WEAPON_SMG]=(FLOAT)-0.375;
wpn_fZ[WEAPON_PIPE]=(FLOAT)-0.75;
wpn_fZ[WEAPON_STRONGPISTOL]=(FLOAT)-0.5;
wpn_fZ[9]=(FLOAT)-0.405;
wpn_fZ[10]=(FLOAT)-0.57;
wpn_fZ[11]=(FLOAT)-0.175;
wpn_fZ[12]=(FLOAT)-0.85;
wpn_fZ[13]=(FLOAT)-0.625;
wpn_fZ[14]=(FLOAT)0;
wpn_fZ[15]=(FLOAT)-0.57;
wpn_fZ[16]=(FLOAT)0;
wpn_fZ[17]=(FLOAT)0;
wpn_fZ[18]=(FLOAT)0;
wpn_fZ[19]=(FLOAT)0;
wpn_fZ[20]=(FLOAT)0;
wpn_fZ[21]=(FLOAT)0;
wpn_fZ[22]=(FLOAT)0;
wpn_fZ[23]=(FLOAT)0;
wpn_fZ[24]=(FLOAT)0;
wpn_fZ[25]=(FLOAT)0;
wpn_fZ[26]=(FLOAT)0;
wpn_fZ[27]=(FLOAT)0;
wpn_fZ[28]=(FLOAT)0;
wpn_fZ[29]=(FLOAT)0;
wpn_fZ[30]=(FLOAT)0;

wpn_fFOV[0]=(FLOAT)2;
wpn_fFOV[1]=(FLOAT)40;
wpn_fFOV[WEAPON_KNIFE]=(FLOAT)60;
wpn_fFOV[WEAPON_AXE]=(FLOAT)40;
wpn_fFOV[WEAPON_PISTOL]=(FLOAT)60;
wpn_fFOV[WEAPON_SHOTGUN]=(FLOAT)50;
wpn_fFOV[WEAPON_SMG]=(FLOAT)60;
wpn_fFOV[WEAPON_PIPE]=(FLOAT)60;
wpn_fFOV[WEAPON_STRONGPISTOL]=(FLOAT)60;
wpn_fFOV[9]=(FLOAT)73.5;
wpn_fFOV[10]=(FLOAT)50;
wpn_fFOV[11]=(FLOAT)70.5;
wpn_fFOV[12]=(FLOAT)23;
wpn_fFOV[13]=(FLOAT)50;
wpn_fFOV[14]=(FLOAT)52.5;
wpn_fFOV[15]=(FLOAT)57;
wpn_fFOV[16]=(FLOAT)0;
wpn_fFOV[17]=(FLOAT)0;
wpn_fFOV[18]=(FLOAT)0;
wpn_fFOV[19]=(FLOAT)0;
wpn_fFOV[20]=(FLOAT)0;
wpn_fFOV[21]=(FLOAT)0;
wpn_fFOV[22]=(FLOAT)0;
wpn_fFOV[23]=(FLOAT)0;
wpn_fFOV[24]=(FLOAT)0;
wpn_fFOV[25]=(FLOAT)0;
wpn_fFOV[26]=(FLOAT)0;
wpn_fFOV[27]=(FLOAT)0;
wpn_fFOV[28]=(FLOAT)0;
wpn_fFOV[29]=(FLOAT)0;
wpn_fFOV[30]=(FLOAT)0;

wpn_fClip[0]=(FLOAT)0;
wpn_fClip[1]=(FLOAT)0.1;
wpn_fClip[WEAPON_KNIFE]=(FLOAT)0.025;
wpn_fClip[WEAPON_AXE]=(FLOAT)0.025;
wpn_fClip[WEAPON_PISTOL]=(FLOAT)0.05;
wpn_fClip[WEAPON_SHOTGUN]=(FLOAT)0.05;
wpn_fClip[WEAPON_SMG]=(FLOAT)0.1;
wpn_fClip[WEAPON_PIPE]=(FLOAT)0.165;
wpn_fClip[WEAPON_STRONGPISTOL]=(FLOAT)0.05;
wpn_fClip[9]=(FLOAT)0.1;
wpn_fClip[10]=(FLOAT)0.1;
wpn_fClip[11]=(FLOAT)0.1;
wpn_fClip[12]=(FLOAT)0.1;
wpn_fClip[13]=(FLOAT)0.1;
wpn_fClip[14]=(FLOAT)0.1;
wpn_fClip[15]=(FLOAT)0.1;
wpn_fClip[16]=(FLOAT)0;
wpn_fClip[17]=(FLOAT)0;
wpn_fClip[18]=(FLOAT)0;
wpn_fClip[19]=(FLOAT)0;
wpn_fClip[20]=(FLOAT)0;
wpn_fClip[21]=(FLOAT)0;
wpn_fClip[22]=(FLOAT)0;
wpn_fClip[23]=(FLOAT)0;
wpn_fClip[24]=(FLOAT)0;
wpn_fClip[25]=(FLOAT)0;
wpn_fClip[26]=(FLOAT)0;
wpn_fClip[27]=(FLOAT)0;
wpn_fClip[28]=(FLOAT)0;
wpn_fClip[29]=(FLOAT)0;
wpn_fClip[30]=(FLOAT)0;

wpn_fFX[0]=(FLOAT)0;
wpn_fFX[1]=(FLOAT)0;
wpn_fFX[WEAPON_KNIFE]=(FLOAT)0;
wpn_fFX[WEAPON_AXE]=(FLOAT)0;
wpn_fFX[WEAPON_PISTOL]=(FLOAT)0;
wpn_fFX[WEAPON_SHOTGUN]=(FLOAT)0;
wpn_fFX[WEAPON_SMG]=(FLOAT)0;
wpn_fFX[WEAPON_PIPE]=(FLOAT)0;
wpn_fFX[WEAPON_STRONGPISTOL]=(FLOAT)0;
wpn_fFX[9]=(FLOAT)0;
wpn_fFX[10]=(FLOAT)0.05;
wpn_fFX[11]=(FLOAT)-0.1;
wpn_fFX[12]=(FLOAT)0;
wpn_fFX[13]=(FLOAT)0.25;
wpn_fFX[14]=(FLOAT)0;
wpn_fFX[15]=(FLOAT)0.25;
wpn_fFX[16]=(FLOAT)0;
wpn_fFX[17]=(FLOAT)0;
wpn_fFX[18]=(FLOAT)0;
wpn_fFX[19]=(FLOAT)0;
wpn_fFX[20]=(FLOAT)0;
wpn_fFX[21]=(FLOAT)0;
wpn_fFX[22]=(FLOAT)0;
wpn_fFX[23]=(FLOAT)0;
wpn_fFX[24]=(FLOAT)0;
wpn_fFX[25]=(FLOAT)0;
wpn_fFX[26]=(FLOAT)0;
wpn_fFX[27]=(FLOAT)0;
wpn_fFX[28]=(FLOAT)0;
wpn_fFX[29]=(FLOAT)0;
wpn_fFX[30]=(FLOAT)0;

wpn_fFY[0]=(FLOAT)0;
wpn_fFY[1]=(FLOAT)0;
wpn_fFY[WEAPON_KNIFE]=(FLOAT)0;
wpn_fFY[WEAPON_AXE]=(FLOAT)0;
wpn_fFY[WEAPON_PISTOL]=(FLOAT)0;
wpn_fFY[WEAPON_SHOTGUN]=(FLOAT)0;
wpn_fFY[WEAPON_SMG]=(FLOAT)0;
wpn_fFY[WEAPON_PIPE]=(FLOAT)0;
wpn_fFY[WEAPON_STRONGPISTOL]=(FLOAT)0;
wpn_fFY[9]=(FLOAT)0;
wpn_fFY[10]=(FLOAT)0.03;
wpn_fFY[11]=(FLOAT)-0.4;
wpn_fFY[12]=(FLOAT)0;
wpn_fFY[13]=(FLOAT)-0.5;
wpn_fFY[14]=(FLOAT)0;
wpn_fFY[15]=(FLOAT)-0.5;
wpn_fFY[16]=(FLOAT)0;
wpn_fFY[17]=(FLOAT)0;
wpn_fFY[18]=(FLOAT)0;
wpn_fFY[19]=(FLOAT)0;
wpn_fFY[20]=(FLOAT)0;
wpn_fFY[21]=(FLOAT)0;
wpn_fFY[22]=(FLOAT)0;
wpn_fFY[23]=(FLOAT)0;
wpn_fFY[24]=(FLOAT)0;
wpn_fFY[25]=(FLOAT)0;
wpn_fFY[26]=(FLOAT)0;
wpn_fFY[27]=(FLOAT)0;
wpn_fFY[28]=(FLOAT)0;
wpn_fFY[29]=(FLOAT)0;
wpn_fFY[30]=(FLOAT)0;



/* the following lines have been moved to the upper part */

/*// tommygun
wpn_fH[6]=(FLOAT)4;
wpn_fP[6]=(FLOAT)3;
wpn_fB[6]=(FLOAT)0;
wpn_fX[6]=(FLOAT)0.121;
wpn_fY[6]=(FLOAT)-0.213;
wpn_fZ[6]=(FLOAT)-0.285;
wpn_fFOV[6]=(FLOAT)49;
wpn_fClip[6]=0.1;
wpn_fFX[6]=(FLOAT)0;
wpn_fFY[6]=(FLOAT)0;

// grenade launcher
wpn_fH[9]=(FLOAT)2;
wpn_fP[9]=(FLOAT)6;
wpn_fB[9]=(FLOAT)0;
wpn_fX[9]=(FLOAT)0.14;
wpn_fY[9]=(FLOAT)-0.41;
wpn_fZ[9]=(FLOAT)-0.335001;
wpn_fFOV[9]=(FLOAT)44.5;
wpn_fClip[9]=(FLOAT)0.1;
wpn_fFX[9]=(FLOAT)0;
wpn_fFY[9]=(FLOAT)0;

// iron cannon
wpn_fH[16]=(FLOAT)2.5;
wpn_fP[16]=(FLOAT)6;
wpn_fB[16]=(FLOAT)0;
wpn_fX[16]=(FLOAT)0.225;
wpn_fY[16]=(FLOAT)-0.345;
wpn_fZ[16]=(FLOAT)-0.57;
wpn_fFOV[16]=(FLOAT)57;
wpn_fClip[16]=(FLOAT)0.1;
wpn_fFX[16]=(FLOAT)0.25;
wpn_fFY[16]=(FLOAT)-0.5;*/

#pragma warning(default: 4305)

#endif

