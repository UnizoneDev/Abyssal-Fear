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
#ifndef UI_PROPERTY_FACTORY_H
#define UI_PROPERTY_FACTORY_H
#include "base_entity_property_tree_item.h"

#include <functional>
#include <map>

class UIPropertyFactory
{
public:
  using TFactory = std::function<BaseEntityPropertyTreeItem* (BasePropertyTreeItem*)>;
  using TFactoryAndPropertyName = std::pair<TFactory, std::string>;
  using TFactoryByName = std::map<std::string, TFactory>;

  static UIPropertyFactory& Instance();

  void            Register(CEntityProperty::PropertyType prop_type, TFactoryAndPropertyName&& factory_and_name);
  const TFactory& GetFactoryFor(CEntityProperty::PropertyType prop_type, const std::string& prop_name) const;
  bool            HasFactoryFor(CEntityProperty::PropertyType prop_type) const;

  struct Registrar
  {
    Registrar(CEntityProperty::PropertyType prop_type, TFactory&& factory);
    Registrar(CEntityProperty::PropertyType prop_type, TFactoryAndPropertyName&& factory_and_name);
  };

  UIPropertyFactory(const UIPropertyFactory&) = delete;
  UIPropertyFactory& operator = (const UIPropertyFactory&) = delete;

private:
  UIPropertyFactory();

private:
  std::map<CEntityProperty::PropertyType, TFactoryByName> m_factories;
};

#endif
