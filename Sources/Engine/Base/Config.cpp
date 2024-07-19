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

#include "stdh.h"

#include <Engine/Base/Config.h>


void LoadConfigFile(const CTFileName &fnmFileName, CConfigPairs &aConfig)
{
    // Open config file
    try {
        CTFileStream strm;
        strm.Open_t(fnmFileName);

        CTString strLine;
        char strProp[256];

        // Value types
        INDEX iValue;
        FLOAT fValue;
        char strValue[256];
        BOOL bValue;
        FLOAT3D vValue;
        DOUBLE3D vdValue;
        INDEX64 i64Value;
        DOUBLE dValue;

        INDEX iLine = 0;

        while (!strm.AtEOF()) {
            // Read non-empty line
            strm.GetLine_t(strLine);
            iLine++;

            strLine.TrimSpacesLeft();
            strLine.TrimSpacesRight();

            if (strLine == "") {
                continue;
            }

            // Try to read the line with a string value as "strProp=strValue"
            if (strLine.ScanF("%256[^=]=\"%256[^\"]\"", strProp, strValue) == 2) {
                // After reading a string value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetString(strValue); // Set string value

              // Try to read the line with a number value as "strProp=fValue"
            }
            else if (strLine.ScanF("%256[^=]=%g", strProp, &fValue) == 2) {
                // After reading a number value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetNumber(fValue); // Set number value

              // Try to read the line with a number value as "strProp=iValue"
            }
            else if (strLine.ScanF("%256[^=]=%d", strProp, &iValue) == 2) {
                // After reading a number value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetIndex(iValue); // Set number value

              // Try to read the line with a number value as "strProp=vValue"
            }
            else if (strLine.ScanF("%256[^=]=%g, %g, %g", strProp, &vValue(1), &vValue(2), &vValue(3)) == 2) {
                // After reading a number value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetVector(FLOAT3D(vValue(1), vValue(2), vValue(3))); // Set number values

              // Try to read the line with a number value as "strProp=vdValue"
            }
            else if (strLine.ScanF("%256[^=]=%g, %g, %g", strProp, &vdValue(1), &vdValue(2), &vdValue(3)) == 2) {
                // After reading a number value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetVectorDouble(DOUBLE3D(vdValue(1), vdValue(2), vdValue(3))); // Set number values

              // Try to read the line with a number value as "strProp=bValue"
            }
            else if (strLine.ScanF("%256[^=]=%d", strProp, &bValue) == 2) {
                // After reading a number value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetBool(bValue); // Set bool value

              // Try to read the line with a number value as "strProp=dValue"
            }
            else if (strLine.ScanF("%256[^=]=%g", strProp, &dValue) == 2) {
                // After reading a number value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetNumberDouble(dValue); // Set number value

              // Try to read the line with a number value as "strProp=i64Value"
            }
            else if (strLine.ScanF("%256[^=]=%d", strProp, &i64Value) == 2) {
                // After reading a number value
                ConfigPair& pair = aConfig.Push();
                pair.key = strProp; // Set key name
                pair.val.SetIndex64(i64Value); // Set number value

              // Invalid line
            }
            else {
                ThrowF_t(TRANS("Couldn't read a key-value pair on line %d"), iLine);
            }
        }

    }
    catch (char* strError) {
        CPrintF(TRANS("Cannot open config file:\n%s\n"), strError);
    }
}
