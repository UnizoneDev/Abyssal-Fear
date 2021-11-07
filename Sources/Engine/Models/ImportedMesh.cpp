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

#include "StdH.h"

#include "ImportedMesh.h"

#include <Engine/Base/Stream.h>
#include <Engine/Graphics/Color.h>
#include <Engine/Math/Functions.h>

#include <assimp/Importer.hpp>
#include <assimp/importerdesc.h>
#include <assimp/scene.h>
#include <assimp/postprocess.h>
#include <assimp/mesh.h>

#include <algorithm>
#include <array>
#include <limits>
#include <unordered_map>
#include <map>
#include <vector>

#ifdef max
#undef max
#endif

#undef W
#undef NONE

namespace
{
  struct aiHasher
  {
    std::size_t operator()(const aiVector3D& vec3d) const
    {
      std::size_t result = 0;
      HashCombine(result, vec3d.x);
      HashCombine(result, vec3d.y);
      HashCombine(result, vec3d.z);
      return result;
    }
  };

  INDEX AI_GetNumFaces(const std::vector<aiMesh*>& meshes)
  {
    INDEX faces = 0;
    for (auto* mesh : meshes)
      faces += mesh->mNumFaces;
    return faces;
  }

  std::vector<aiMesh*> AI_GetValidMeshes(const aiScene* aiSceneMain)
  {
    std::vector<aiMesh*> validMeshes;

    for (size_t i = 0; i < aiSceneMain->mNumMeshes; ++i)
      if (aiSceneMain->mMeshes[i]->HasFaces())
      {
        for (size_t j = 0; j < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++j)
          if (aiSceneMain->mMeshes[i]->HasTextureCoords(j))
          {
            validMeshes.push_back(aiSceneMain->mMeshes[i]);
            break;
          }
      }

    return validMeshes;
  }

  const aiNode* AI_FindMeshNode(const aiScene* aiSceneMain, const aiNode* node, const aiMesh* mesh)
  {
    for (size_t i = 0; i < node->mNumMeshes; ++i)
      if (aiSceneMain->mMeshes[node->mMeshes[i]] == mesh)
        return node;

    for (size_t i = 0; i < node->mNumChildren; ++i)
      if (const auto* foundInChild = AI_FindMeshNode(aiSceneMain, node->mChildren[i], mesh))
        return foundInChild;

    return nullptr;
  }

  aiMatrix4x4 AI_GetAbsoluteTransform(const aiNode* node)
  {
    if (node->mParent)
      return AI_GetAbsoluteTransform(node->mParent) * node->mTransformation;

    return node->mTransformation;
  }

  std::map<const aiMesh*, aiMatrix4x4> AI_GetWorldTransforms(const aiScene* aiSceneMain, const std::vector<aiMesh*>& meshes)
  {
    std::map<const aiMesh*, aiMatrix4x4> meshTransform;
    for (const auto* mesh : meshes)
      if (const auto* node = AI_FindMeshNode(aiSceneMain, aiSceneMain->mRootNode, mesh))
        meshTransform[mesh] = AI_GetAbsoluteTransform(node);

    return meshTransform;
  }
} // anonymous namespace

const std::vector<ImportedMesh::TFormatDescr>& ImportedMesh::GetSupportedFormats()
{
  static std::vector<TFormatDescr> formats;

  if (formats.empty())
  {
    Assimp::Importer importer;
    for (size_t i = 0; i < importer.GetImporterCount(); ++i)
    {
      const aiImporterDesc* pDescription = importer.GetImporterInfo(i);
      TFormatDescr descr;
      descr.first = pDescription->mName;
      descr.second = "*.";
      for (const char* c = pDescription->mFileExtensions; *c; ++c)
      {
        if (std::isspace(*c))
          descr.second += ";*.";
        else
          descr.second += *c;
      }
      descr.first += " (" + descr.second + ")";
      formats.emplace_back(std::move(descr));
    }
    std::sort(formats.begin(), formats.end(), [](const TFormatDescr& lhs, const TFormatDescr& rhs) { return lhs.first < rhs.first; });
  }

  return formats;
}

ImportedMesh::ImportedMesh(const CTFileName& fnmFileName, const FLOATmatrix3D& mTransform)
{
  // call file load with file's full path name
  CTString strFile = _fnmApplicationPath + fnmFileName;
  char acFile[MAX_PATH];
  wsprintfA(acFile, "%s", strFile);

  Assimp::Importer importerWithoutNormals;
  // do not read normals from input file
  importerWithoutNormals.SetPropertyInteger(AI_CONFIG_PP_RVC_FLAGS, aiComponent_NORMALS);
  const aiScene* aiSceneMain = importerWithoutNormals.ReadFile(acFile,
    aiProcess_JoinIdenticalVertices |
    aiProcess_Triangulate |
    aiProcess_GenUVCoords |
    aiProcess_RemoveComponent |
    aiProcess_FlipUVs);

  // if scene is successefuly loaded
  if (aiSceneMain && aiSceneMain->mNumMeshes > 0 && aiSceneMain->mNumMaterials > 0)
  {
    FillConversionArrays_t(mTransform, aiSceneMain);
  }
  else
  {
    ThrowF_t("Unable to load 3D object: %s", (const char*)fnmFileName);
  }
}

void ImportedMesh::FillConversionArrays_t(const FLOATmatrix3D& mTransform, const aiScene* aiSceneMain)
{
  // all polygons must be triangles
  const auto validMeshes = AI_GetValidMeshes(aiSceneMain);
  if (validMeshes.empty())
    throw("Error: model has no UV map!");

  const auto meshTransform = AI_GetWorldTransforms(aiSceneMain, validMeshes);
  if (meshTransform.size() != validMeshes.size())
    throw("Error: model has broken scene graph!");

  // check if we need flipping (if matrix is flipping, polygons need to be flipped)
  const FLOATmatrix3D& m = mTransform;
  FLOAT fDet =
    m(1, 1) * (m(2, 2) * m(3, 3) - m(2, 3) * m(3, 2)) +
    m(1, 2) * (m(2, 3) * m(3, 1) - m(2, 1) * m(3, 3)) +
    m(1, 3) * (m(2, 1) * m(3, 2) - m(2, 2) * m(3, 1));
  FLOAT bFlipped = fDet < 0;

  // ------------  Find UV map indices
  std::map<aiMesh*, std::array<unsigned int, 3>> uvChannels;
  for (auto* mesh : validMeshes)
  {
    auto& coordsRemap = uvChannels[mesh];
    coordsRemap = { AI_MAX_NUMBER_OF_TEXTURECOORDS, AI_MAX_NUMBER_OF_TEXTURECOORDS , AI_MAX_NUMBER_OF_TEXTURECOORDS };
    for (size_t j = 0, uvIndex = 0; uvIndex < 3 && j < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++j)
    {
      if (mesh->HasTextureCoords(j))
        coordsRemap[uvIndex++] = j;
    }
  }

  // ------------  Convert object vertices (coordinates)
  std::unordered_map<aiVector3D, INDEX, aiHasher> uniqueVertices;
  std::vector<aiVector3D> orderedUniqueVertices;
  for (auto* mesh : validMeshes)
  {
    for (size_t v = 0; v < mesh->mNumVertices; ++v)
    {
      if (uniqueVertices.find(mesh->mVertices[v]) == uniqueVertices.end())
      {
        uniqueVertices[mesh->mVertices[v]] = orderedUniqueVertices.size();
        orderedUniqueVertices.push_back(meshTransform.at(mesh) * mesh->mVertices[v]);
      }
    }
  }
  m_vertices.resize(orderedUniqueVertices.size());
  // copy vertices
  for (size_t iVtx = 0; iVtx < orderedUniqueVertices.size(); ++iVtx)
  {
    FLOAT3D vtx(orderedUniqueVertices[iVtx][0], orderedUniqueVertices[iVtx][1], orderedUniqueVertices[iVtx][2]);
    m_vertices[iVtx] = vtx * mTransform;
    m_vertices[iVtx](1) = -m_vertices[iVtx](1);
    m_vertices[iVtx](3) = -m_vertices[iVtx](3);
  }
  orderedUniqueVertices.clear();

  // ------------ Convert object's mapping vertices (texture vertices)
  std::unordered_map<aiVector3D, INDEX, aiHasher> uniqueTexCoords[3];
  for (size_t iUVMapIndex = 0; iUVMapIndex < 3; ++iUVMapIndex)
  {
    std::vector<aiVector3D*> orderedUniqueTexCoords;
    for (auto* mesh : validMeshes)
    {
      size_t uv = uvChannels[mesh][iUVMapIndex];
      if (!mesh->HasTextureCoords(uv))
        continue;

      for (size_t v = 0; v < mesh->mNumVertices; ++v)
      {
        if (uniqueTexCoords[iUVMapIndex].find(mesh->mTextureCoords[uv][v]) == uniqueTexCoords[iUVMapIndex].end())
        {
          uniqueTexCoords[iUVMapIndex][mesh->mTextureCoords[uv][v]] = orderedUniqueTexCoords.size();
          orderedUniqueTexCoords.push_back(&mesh->mTextureCoords[uv][v]);
        }
      }
    }
    if (orderedUniqueTexCoords.empty())
      continue;

    m_uvs[iUVMapIndex].resize(orderedUniqueTexCoords.size());
    // copy texture vertices
    for (size_t iTVtx = 0; iTVtx < orderedUniqueTexCoords.size(); ++iTVtx)
      m_uvs[iUVMapIndex][iTVtx] = FLOAT2D(orderedUniqueTexCoords[iTVtx]->x, orderedUniqueTexCoords[iTVtx]->y);
  }

  // ------------ Organize triangles as list of surfaces
  // allocate triangles
  m_triangles.resize(AI_GetNumFaces(validMeshes));

  std::map<ULONG, ULONG> materialRemap;
  // sort triangles per surfaces
  INDEX trianglesOffset = 0;
  size_t meshIndex = 0;
  for (auto* mesh : validMeshes)
  {
    for (INDEX iTriangle = 0; iTriangle < mesh->mNumFaces; iTriangle++)
    {
      auto& ctTriangle = m_triangles[trianglesOffset + iTriangle];

      const aiFace* ai_face = &mesh->mFaces[iTriangle];
      // copy vertex indices
      if (bFlipped) {
        ctTriangle.ct_iVtx[0] = uniqueVertices[mesh->mVertices[ai_face->mIndices[2]]];
        ctTriangle.ct_iVtx[1] = uniqueVertices[mesh->mVertices[ai_face->mIndices[1]]];
        ctTriangle.ct_iVtx[2] = uniqueVertices[mesh->mVertices[ai_face->mIndices[0]]];
      }
      else {
        ctTriangle.ct_iVtx[0] = uniqueVertices[mesh->mVertices[ai_face->mIndices[0]]];
        ctTriangle.ct_iVtx[1] = uniqueVertices[mesh->mVertices[ai_face->mIndices[1]]];
        ctTriangle.ct_iVtx[2] = uniqueVertices[mesh->mVertices[ai_face->mIndices[2]]];
      }


      for (size_t iUVMapIndex = 0; iUVMapIndex < 3; ++iUVMapIndex)
      {
        size_t uv = uvChannels[mesh][iUVMapIndex];
        if (!mesh->HasTextureCoords(uv))
          continue;

        // copy texture vertex indices
        if (bFlipped) {
          ctTriangle.ct_iTVtx[iUVMapIndex][0] = uniqueTexCoords[iUVMapIndex][mesh->mTextureCoords[uv][ai_face->mIndices[2]]];
          ctTriangle.ct_iTVtx[iUVMapIndex][1] = uniqueTexCoords[iUVMapIndex][mesh->mTextureCoords[uv][ai_face->mIndices[1]]];
          ctTriangle.ct_iTVtx[iUVMapIndex][2] = uniqueTexCoords[iUVMapIndex][mesh->mTextureCoords[uv][ai_face->mIndices[0]]];
        }
        else {
          ctTriangle.ct_iTVtx[iUVMapIndex][0] = uniqueTexCoords[iUVMapIndex][mesh->mTextureCoords[uv][ai_face->mIndices[0]]];
          ctTriangle.ct_iTVtx[iUVMapIndex][1] = uniqueTexCoords[iUVMapIndex][mesh->mTextureCoords[uv][ai_face->mIndices[1]]];
          ctTriangle.ct_iTVtx[iUVMapIndex][2] = uniqueTexCoords[iUVMapIndex][mesh->mTextureCoords[uv][ai_face->mIndices[2]]];
        }
      }

      // obtain material
      ULONG materialIndex = mesh->mMaterialIndex;
      // attach triangle into one material
      auto foundPos = materialRemap.find(materialIndex);
      if (foundPos != materialRemap.end())
      {
        ctTriangle.ct_iMaterial = foundPos->second;
        continue;
      }

      // add new material
      m_materials.emplace_back();
      // set polygon's material index 
      INDEX iNewMaterial = m_materials.size() - 1;
      ctTriangle.ct_iMaterial = iNewMaterial;

      // remember recognition tag
      materialRemap[materialIndex] = iNewMaterial;

      // ---------- Set material's name
      // if not default material

      aiString materialName;
      aiSceneMain->mMaterials[materialIndex]->Get(AI_MATKEY_NAME, materialName);

      if (materialName.length > 0)
      {
        m_materials[iNewMaterial].cm_strName = CTString(materialName.C_Str());
        // get color
        const double materialCoefficient = static_cast<double>(++meshIndex) / validMeshes.size();
        COLOR colColor = static_cast<COLOR>(std::numeric_limits<COLOR>::max() * materialCoefficient);
        m_materials[iNewMaterial].cm_colColor = colColor;
      }
      else
      {
        m_materials[iNewMaterial].cm_strName = "Default";
        m_materials[iNewMaterial].cm_colColor = C_GRAY;
      }
    }
    trianglesOffset += mesh->mNumFaces;
  }
}
