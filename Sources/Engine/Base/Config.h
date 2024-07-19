/* Copyright (c) 2021-2024 Dreamy Cecil & Uni Musuotankarep
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

#ifndef SE_INCL_CONFIG_H
#define SE_INCL_CONFIG_H

#ifdef PRAGMA_ONCE
#pragma once
#endif

#include <Engine/Base/FileName.h>
#include <Engine/Base/Stream.h>
#include <Engine/Base/Console.h>
#include <Engine/Templates/StaticStackArray.h>
#include <Engine/Templates/StaticStackArray.cpp>
#include <Engine/Math/Vector.h>

// Config value of multiple types
class ENGINE_API ConfigValue {
    public:
    BOOL bString;
    BOOL bFloat;
    BOOL bBool;
	BOOL bVector;

    CTString strValue;
    FLOAT fValue;
    INDEX iValue;
    BOOL bValue;
	FLOAT3D vValue;
    DOUBLE dValue;
    INDEX64 i64Value;
    DOUBLE3D vdValue;

    void SetString(const CTString& str) {
        strValue = str;
        bString = TRUE;
        bFloat = FALSE;
        bBool = FALSE;
        bVector = FALSE;
    };

    void SetNumber(const FLOAT f) {
        fValue = f;
        bString = FALSE;
        bFloat = TRUE;
        bBool = FALSE;
		bVector = FALSE;
    };

    void SetIndex(const INDEX i) {
        iValue = i;
        bString = FALSE;
        bFloat = FALSE;
        bBool = FALSE;
		bVector = FALSE;
    };

    void SetBool(const BOOL b) {
        bValue = b;
        bString = FALSE;
        bFloat = FALSE;
        bBool = TRUE;
	    bVector = FALSE;
    };

    void SetVector(const FLOAT3D& v) {
        vValue = v;
        bString = FALSE;
        bFloat = FALSE;
        bBool = FALSE;
        bVector = TRUE;
    };

    void SetVectorDouble(const DOUBLE3D& vd) {
        vdValue = vd;
        bString = FALSE;
        bFloat = FALSE;
        bBool = FALSE;
        bVector = TRUE;
    };

    void SetIndex64(const INDEX64 i64) {
        i64Value = i64;
        bString = FALSE;
        bFloat = FALSE;
        bBool = FALSE;
        bVector = FALSE;
    };

    void SetNumberDouble(const DOUBLE d) {
        dValue = d;
        bString = FALSE;
        bFloat = TRUE;
        bBool = FALSE;
        bVector = FALSE;
    };
};

// Value under some name
class ENGINE_API ConfigPair {
    public:
    CTString key;
    ConfigValue val;
};

// Stack of key-value pairs
typedef CStaticStackArray<ConfigPair> CConfigPairs;

ENGINE_API void LoadConfigFile(const CTFileName &fnmFileName, CConfigPairs &aConfig);

#endif
