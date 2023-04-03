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

#include "stdh.h"

#include <Engine/Base/Config.h>


void LoadConfigFile(const CTFileName &fnmFileName, CConfigPairs &aConfig)
{
    // Open enemy config file
    try {
        CTFileStream strm;
        strm.Open_t(fnmFileName);

        CTString strLine;
        char strProp[256];

        // Value types
        INDEX iValue;
        FLOAT fValue;
        char strValue[256];

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

              // Invalid line
            }
            else {
                ThrowF_t(TRANS("Couldn't read a key-value pair on line %d"), iLine);
            }
        }

    }
    catch (char* strError) {
        CPrintF(TRANS("Cannot open enemy config file:\n%s\n"), strError);
    }
}
