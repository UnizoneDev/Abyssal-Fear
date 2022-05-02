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

#ifndef ANGLE_PICKER_H
#define ANGLE_PICKER_H

#include <QDialog>

#include <memory>

namespace Ui {
class AnglePicker;
}

class AnglePicker : public QDialog {
  Q_OBJECT

public:
  explicit AnglePicker(QWidget* parent = nullptr);
  ~AnglePicker();

  ANGLE3D GetAngle() const;

private:
  std::unique_ptr<Ui::AnglePicker> mp_ui;
  ANGLE3D m_angle;
};

#endif
