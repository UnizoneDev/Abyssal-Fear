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

#include "StdAfx.h"
#include "ui_property_factory.h"
#include "base_entity_property_tree_item.h"
#include "checklist_widget.h"

class Property_Ammo : public BaseEntityPropertyTreeItem
{
private:
  enum AmmoType {
    AMMO_BULLETS = 0,
    AMMO_SHELLS = 1,
    AMMO_ROCKETS = 2,
    AMMO_GRENADES = 3,
    AMMO_NAPALM = 4,
    AMMO_ELECTRICITY = 5,
    AMMO_IRONBALLS = 7,
    AMMO_SNIPERBULLETS = 8
  };

public:
  Property_Ammo(BasePropertyTreeItem* parent)
    : BaseEntityPropertyTreeItem(parent)
  {
  }

  QWidget* CreateEditor(QWidget* parent) override final
  {
    m_flags.clear();
    auto* editor = new CheckListWidget(parent);
    _AddFlag(editor, "Bullets", 1 << AMMO_BULLETS);
    _AddFlag(editor, "Shells", 1 << AMMO_SHELLS);
    _AddFlag(editor, "Rockets", 1 << AMMO_ROCKETS);
    _AddFlag(editor, "Grenades", 1 << AMMO_GRENADES);
    _AddFlag(editor, "Napalm", 1 << AMMO_NAPALM);
    _AddFlag(editor, "Electricity", 1 << AMMO_ELECTRICITY);
    _AddFlag(editor, "Cannon Balls", 1 << AMMO_IRONBALLS);
    _AddFlag(editor, "Sniper Bullets", 1 << AMMO_SNIPERBULLETS);

    QObject::connect(editor, &CheckListWidget::Changed, this, [this]
      {
        ULONG bits_to_clear = MAX_ULONG;
        ULONG bits_to_set = 0;

        for (auto* flag : m_flags)
        {
          if (flag->checkState() == Qt::Unchecked)
            bits_to_clear &= ~static_cast<ULONG>(flag->data().toUInt());
          else if (flag->checkState() == Qt::Checked)
            bits_to_set |= static_cast<ULONG>(flag->data().toUInt());
        }

        for (auto* entity : m_entities)
        {
          auto& ammo = _GetAmmo(entity);
          ammo &= bits_to_clear;
          ammo |= bits_to_set;
        }

        CWorldEditorDoc* pDoc = theApp.GetDocument();
        pDoc->SetModifiedFlag(TRUE);
        pDoc->UpdateAllViews(NULL);
      });

    return editor;
  }

  bool ValueIsCommonForAllEntities() const override final
  {
    return true;
  }

  void SetFirstValueToAllEntities() override final
  {
  }

private:
  QString _GetTypeName() const override final
  {
    return "AMMO";
  }

  void _AddFlag(CheckListWidget* editor, const QString& label, ULONG flag)
  {
    static_assert(sizeof(ULONG) == sizeof(unsigned int));
    m_flags.push_back(editor->AddItem(label, _GetFlagState(flag), static_cast<unsigned int>(flag)));
  }

  Qt::CheckState _GetFlagState(ULONG flag) const
  {
    auto it = m_entities.begin();
    const bool flag_is_set = _GetAmmo(*it) & flag;
    for (++it; it != m_entities.end(); ++it)
    {
      const bool curr_flag = _GetAmmo(*it) & flag;
      if (curr_flag != flag_is_set)
        return Qt::PartiallyChecked;
    }
    if (flag_is_set)
      return Qt::Checked;
    return Qt::Unchecked;
  }

  INDEX& _GetAmmo(CEntity* entity) const
  {
    CEntityProperty* actual_property = entity->PropertyForName(mp_property->pid_strName);
    return ENTITYPROPERTY(entity, actual_property->ep_slOffset, INDEX);
  }

private:
  std::vector<QStandardItem*> m_flags;
};

/*******************************************************************************************/
static UIPropertyFactory::Registrar g_registrar(CEntityProperty::PropertyType::EPT_INDEX,
  {
  [](BasePropertyTreeItem* parent)
  {
    return new Property_Ammo(parent);
  },
  "Take Ammo"
  });
