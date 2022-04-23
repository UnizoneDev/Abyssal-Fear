/* Copyright (c) 2022 SeriousAlexej (Oleksii Sierov).
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

#include "StdAfx.h"
#include "ScriptIO.h"

#include <fstream>

namespace ScriptIO {

void SaveToFile(const ModelScript& script, const CTFileName& filename)
{
  CTString strFile = _fnmApplicationPath + filename;
  std::ofstream file;
  file.open(strFile.str_String, std::ios_base::out | std::ios_base::trunc);
  if (!file.is_open())
    throw "Failed to save script!";

  CTString lastDir;
  auto write_dir = [&](const CTFileName& f)
  {
    const CTString dir = static_cast<CTString>(f.FileDir());
    if (lastDir == dir)
      return;
    lastDir = dir;
    file << "DIRECTORY " << dir.str_String << '\n';
  };
  auto write_file = [&](const CTFileName& f, const char* tag = "")
  {
    const CTString fnm = static_cast<CTString>(f.FileName() + f.FileExt());
    file << tag << ' ' << fnm.str_String << '\n';
  };

  file << "TEXTURE_DIM " << script.m_textureScale(1) << ' ' << script.m_textureScale(2) << '\n';

  file << "TRANSFORM";
  for (int row = 1; row <= 3; ++row)
    for (int col = 1; col <= 3; ++col)
      file << ' ' << script.m_transformation(row, col);
  file << '\n';

  file << "SIZE " << script.m_scale << '\n';

  file << "MAX_SHADOW " << script.m_maxShadow << '\n';

  if (script.m_highQuality)
    file << "HI_QUALITY YES\n";

  if (script.m_flat == ModelScript::Flat::Half)
    file << "HALF_FLAT YES\n";
  else if (script.m_flat == ModelScript::Flat::Full)
    file << "FLAT YES\n";

  if (script.m_stretchDetail)
    file << "STRETCH_DETAIL YES\n";

  if (!script.m_boneTriangles)
    file << "NO_BONE_TRIANGLES\n";

  file << '\n';

  if (script.m_skeleton.has_value())
  {
    write_dir(*script.m_skeleton);
    write_file(*script.m_skeleton, "SKELETON");
  }

  if (!script.m_mipModels.empty())
    write_dir(script.m_mipModels.front());
  file << "MIP_MODELS " << script.m_mipModels.size() << '\n';
  for (const auto& mip_file : script.m_mipModels)
    write_file(mip_file);

  file << '\n';
  file << "ANIM_START\n";
  file << '\n';
  lastDir = "";

  for (const auto& anim : script.m_animations)
  {
    if (!anim.m_frames.empty())
      write_dir(anim.m_frames.front());

    if (anim.m_type == ModelScript::Animation::Type::Vertex)
    {
      file << "ANIMATION " << anim.m_name << '\n';

      double speed = 0.1;
      if (!anim.m_frames.empty() && anim.m_optDuration.has_value() && *anim.m_optDuration > 0.001)
        speed = anim.m_frames.size() / (*anim.m_optDuration);
      file << "SPEED " << static_cast<float>(speed) << '\n';

      for (const auto& frame : anim.m_frames)
        write_file(frame);
    }
    else
    {
      file << "SKELETAL_ANIMATION " << anim.m_name << '\n';

      if (anim.m_customSourceName.has_value())
        file << "ANIM_NAME_IN_FILE " << *anim.m_customSourceName << '\n';

      if (anim.m_optRefSkeleton.has_value())
        write_file(*anim.m_optRefSkeleton, "ORIG_SKELETON");

      if (anim.m_optDuration.has_value())
        file << "DURATION " << *anim.m_optDuration << '\n';

      if (anim.m_optNumFrames.has_value())
        file << "NUM_FRAMES " << *anim.m_optNumFrames << '\n';

      if (!anim.m_frames.empty())
        write_file(anim.m_frames.front(), "SOURCE_FILE");
    }
    file << '\n';
  }

  file << "ANIM_END\n";
  file << "END\n";
}

} // namespace ScriptIO
