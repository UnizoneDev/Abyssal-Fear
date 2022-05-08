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
#include "AnglePicker.h"
#include "AnglePicker.h.moc"
#include "AnglePicker.ui.h"

AnglePicker::AnglePicker(QWidget* parent)
  : QDialog(parent)
  , mp_ui(std::make_unique<Ui::AnglePicker>())
  , m_angle(0.0f, 0.0f, 0.0f)
{
  setWindowFlags(windowFlags() & ~Qt::WindowContextHelpButtonHint);
  mp_ui->setupUi(this);

  connect(mp_ui->spinboxHeading, QOverload<double>::of(&QDoubleSpinBox::valueChanged), this, [this](double val) { m_angle(1) = val; });
  connect(mp_ui->spinboxPitch, QOverload<double>::of(&QDoubleSpinBox::valueChanged), this, [this](double val) { m_angle(2) = val; });
  connect(mp_ui->spinboxBanking, QOverload<double>::of(&QDoubleSpinBox::valueChanged), this, [this](double val) { m_angle(3) = val; });
  connect(mp_ui->confirmationButtons, &QDialogButtonBox::accepted, this, &QDialog::accept);
  connect(mp_ui->confirmationButtons, &QDialogButtonBox::rejected, this, &QDialog::reject);
}

AnglePicker::~AnglePicker()
{
}

ANGLE3D AnglePicker::GetAngle() const
{
  return m_angle;
}
