/* Copyright (c) 2021 SeriousAlexej (Oleksii Sierov).
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

#ifndef IMPORTED_MESH_H
#define IMPORTED_MESH_H

#include <Engine/Base/CTString.h>
#include <Engine/Math/Vector.h>

#include <string>
#include <utility>
#include <vector>

struct aiScene;

struct ENGINE_API ImportedMesh
{
public:
  using TFormatDescr = std::pair<std::string, std::string>;
  static const std::vector<TFormatDescr>& GetSupportedFormats();

  ImportedMesh(const CTFileName& fnmFileName, const FLOATmatrix3D& mTransform);

  struct Triangle
  {
    INDEX ct_iVtx[3];    // indices of vertices
    INDEX ct_iTVtx[3][3];// indices of texture vertices
    INDEX ct_iMaterial;  // index of material
  };

  struct Material
  {
    CTString cm_strName;
    COLOR cm_colColor;
  };

public:
  std::vector<Triangle> m_triangles;
  std::vector<Material> m_materials;
  std::vector<FLOAT3D> m_vertices;
  std::vector<FLOAT2D> m_uvs[3];

private:
  void FillConversionArrays_t(const FLOATmatrix3D& mTransform, const aiScene* aiSceneMain);
};

#endif IMPORTED_MESH_H
