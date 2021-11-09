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

#include "ImportedSkeleton.h"

#include <Engine/Base/Stream.h>

#include <assimp/Importer.hpp>
#include <assimp/postprocess.h>
#include <assimp/scene.h>

#undef W
#undef NONE

void ImportedSkeleton::FillFromFile(const CTFileName& fileName, const FLOATmatrix3D& mTransform)
{
  CTString strFile = _fnmApplicationPath + fileName;
  char acFile[MAX_PATH];
  wsprintfA(acFile, "%s", strFile);

  Assimp::Importer importerWithoutNormals;
  const aiScene* aiSceneMain = importerWithoutNormals.ReadFile(acFile, 0);

  // if scene is successefuly loaded
  if (aiSceneMain)
  {
    FillFromScene(*aiSceneMain, mTransform);
  }
  else
  {
    ThrowF_t("Unable to load skeleton: %s", (const char*)fileName);
  }
}

void ImportedSkeleton::FillFromScene(const aiScene& scene, const FLOATmatrix3D& mTransform)
{
  mp_rootBone = nullptr;
  m_bones.clear();
  AppendBone(scene.mRootNode);

  FLOATmatrix4D transform4D;
  transform4D.Diagonal(1.0f);
  for (size_t row = 1; row <= 3; ++row)
    for (size_t col = 1; col <= 3; ++col)
      transform4D(row, col) = mTransform(row, col);

  for (auto it = m_bones.begin(); it != m_bones.end(); ++it)
    it->second.m_transformToParent = transform4D * it->second.m_transformToParent;
}

const ImportedSkeleton::Bone* ImportedSkeleton::AppendBone(const aiNode* node, const Bone* parent)
{
  std::string boneName = node->mName.C_Str();
  if (boneName.empty())
    boneName = "UnnamedNode_RandomName_" + std::to_string(m_bones.size());

  FLOATmatrix4D transformToParent;
  for (int row = 0; row < 4; ++row)
    for (int col = 0; col < 4; ++col)
      transformToParent(row + 1, col + 1) = node->mTransformation[row][col];

  // according to assimp documentation, bone nodes have unique names,
  // but other nodes might share name, so it is enough to simply make it unique here
  // just for the map structure to be valid, actual names for such nodes are not important
  while (m_bones.find(boneName) != m_bones.end())
    boneName += '_';

  auto& bone = m_bones[boneName];
  if (!mp_rootBone)
    mp_rootBone = &bone;
  bone.m_name = boneName;
  bone.mp_parent = parent;
  bone.m_transformToParent = transformToParent;

  for (size_t childIndex = 0; childIndex < node->mNumChildren; ++childIndex)
    bone.m_children.push_back(AppendBone(node->mChildren[childIndex], &bone));

  return &bone;
}

bool ImportedSkeleton::Empty() const
{
  return m_bones.empty();
}

ImportedSkeleton::Bone& ImportedSkeleton::GetRootBone()
{
  return *mp_rootBone;
}

ImportedSkeleton::Bone& ImportedSkeleton::GetBone(const std::string& name)
{
  return m_bones.at(name);
}

const ImportedSkeleton::Bone& ImportedSkeleton::GetRootBone() const
{
  return *mp_rootBone;
}

const ImportedSkeleton::Bone& ImportedSkeleton::GetBone(const std::string& name) const
{
  return m_bones.at(name);
}
