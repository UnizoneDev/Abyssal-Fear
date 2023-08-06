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

// DlgPgHitboxes.h : header file
//
#ifndef DLGPGHITBOXES_H
#define DLGPGHITBOXES_H 1

/////////////////////////////////////////////////////////////////////////////
// CDlgPgHitboxes dialog

class CDlgPgHitboxes : public CPropertyPage
{
	DECLARE_DYNCREATE(CDlgPgHitboxes)

	// Construction
public:
	CUpdateable m_udAllValues;
	CDlgPgHitboxes();
	~CDlgPgHitboxes();
	BOOL OnIdle(LONG lCount);

	// Dialog Data
		//{{AFX_DATA(CDlgPgHitboxes)
	enum { IDD = IDD_INFO_HITBOXES };
	float	m_fWidth;
	float	m_fHeight;
	float	m_fLenght;
	float	m_fXCenter;
	float	m_fYDown;
	float	m_fZCenter;
	int		m_EqualityRadio;
	CString	m_strHitBoxName;
	CString	m_strHitBoxIndex;
	//}}AFX_DATA


// Overrides
	// ClassWizard generate virtual function overrides
	//{{AFX_VIRTUAL(CDlgPgHitboxes)
protected:
	virtual void DoDataExchange(CDataExchange* pDX);    // DDX/DDV support
	//}}AFX_VIRTUAL

// Implementation
protected:
	// Generated message map functions
	//{{AFX_MSG(CDlgPgHitboxes)
	afx_msg void OnChangeEditWidthHitBox();
	afx_msg void OnChangeEditHeightHitBox();
	afx_msg void OnChangeEditLenghtHitBox();
	afx_msg void OnChangeEditXCenterHitBox();
	afx_msg void OnChangeEditYDownHitBox();
	afx_msg void OnChangeEditZCenterHitBox();
	afx_msg void OnHEqWHitBox();
	afx_msg void OnLEqWHitBox();
	afx_msg void OnLEqHHitBox();
	afx_msg void OnAddHitBox();
	afx_msg void OnChangeHitBoxName();
	afx_msg void OnNextHitBox();
	afx_msg void OnPreviousHitBox();
	afx_msg void OnRemoveHitBox();
	afx_msg void OnAllignToSizeHitBox();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()

};
#endif // DLGPGHITBOXES_H
