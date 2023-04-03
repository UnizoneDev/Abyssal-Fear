/* Copyright (c) 2021-2023 Uni Musuotankarep
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

// Config value of multiple types
class ENGINE_API ConfigValue {
    public:
    BOOL bString;
    BOOL bFloat;

    CTString strValue;
    FLOAT fValue;
    INDEX iValue;

    void SetString(const CTString& str) {
        strValue = str;
        bString = TRUE;
        bFloat = FALSE;
    };

    void SetNumber(const FLOAT f) {
        fValue = f;
        bString = FALSE;
        bFloat = TRUE;
    };

    void SetIndex(const INDEX i) {
        iValue = i;
        bString = FALSE;
        bFloat = FALSE;
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
