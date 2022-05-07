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
#include "BonePicker.h"
#include "BonePicker.h.moc"
#include "BonePicker.ui.h"

BonePicker::BonePicker(const CEditModel::TBoneToTriangle& boneTriangleMapping, QWidget* parent)
  : QDialog(parent)
  , mp_ui(std::make_unique<Ui::BonePicker>())
  , m_boneTriangleMapping(boneTriangleMapping)
{
  setWindowFlags(windowFlags() & ~Qt::WindowContextHelpButtonHint);
  mp_ui->setupUi(this);

  for ([[maybe_unused]] const auto& [boneName, triangle] : m_boneTriangleMapping)
    mp_ui->listBones->addItem(QString::fromStdString(boneName));

  connect(mp_ui->buttonBox, &QDialogButtonBox::accepted, this, &QDialog::accept);
  connect(mp_ui->buttonBox, &QDialogButtonBox::rejected, this, &QDialog::reject);
}

BonePicker::~BonePicker()
{
}

std::array<INDEX, 3> BonePicker::GetBoneTriangle() const
{
  if (auto* p_currentItem = mp_ui->listBones->currentItem())
    return m_boneTriangleMapping.at(p_currentItem->text().toStdString());

  return { 0, 0, 0 };
}
