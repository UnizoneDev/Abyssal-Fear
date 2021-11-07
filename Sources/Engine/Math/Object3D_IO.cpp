/* Copyright (c) 2002-2012 Croteam Ltd. 
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

#include <Engine/Math/Object3D.h>

#include <Engine/Base/Registry.h>
#include <Engine/Base/Stream.h>
#include <Engine/Base/Memory.h>
#include <Engine/Base/ErrorReporting.h>
#include <Engine/Graphics/Color.h>
#include <Engine/Models/ImportedMesh.h>

#include <Engine/Templates/DynamicContainer.cpp>
#include <Engine/Templates/DynamicArray.cpp>
#include <Engine/Templates/StaticStackArray.cpp>

#include <Engine/Math/TextureMapping_Utils.h>



/////////////////////////////////////////////////////////////////////////////
// Helper functions

//--------------------------------------------------------------------------------------------
class CObjectSectorLock {
private:
	CObjectSector *oscl_posc;						// ptr to object sector that will do lock/unlock
public:
	CObjectSectorLock( CObjectSector *posc);		// lock all object sector arrays
	~CObjectSectorLock();										// unlock all object sector arrays
};

//--------------------------------------------------------------------------------------------
/*
 * To lock all object 3D dyna arrays one must create an instance of CObject3DLock.
 * Locking job is done inside class constructor
 */
CObjectSectorLock::CObjectSectorLock( CObjectSector *posc) {
	ASSERT( posc != NULL);
  oscl_posc = posc;
  posc->LockAll();
}

//--------------------------------------------------------------------------------------------
/*
 * Unlocking of all object 3D dynamic arrays will occur automatically when exiting
 * current scope (routine). This is done in class destructor
 */
CObjectSectorLock::~CObjectSectorLock() {
  oscl_posc->UnlockAll();
}

/*
 * Convert straightfowrard from intermediate structures into O3D
 */
void CObject3D::FillFromMesh(const ImportedMesh& mesh)
{
  // create one sector
  CObjectSector &osc = *ob_aoscSectors.New(1);
  // this will lock at the instancing and unlock while destructing all sector arrays
  CObjectSectorLock OSectorLock(&osc);

  // ------------ Vertices
  INDEX ctVertices = mesh.m_vertices.size();
  CObjectVertex *pVtx = osc.osc_aovxVertices.New(ctVertices);
  for(INDEX iVtx=0; iVtx<ctVertices; iVtx++)
  {
    pVtx[ iVtx] = FLOATtoDOUBLE( mesh.m_vertices[iVtx]);
  }

  // ------------ Materials
  INDEX ctMaterials = mesh.m_materials.size();
  osc.osc_aomtMaterials.New( ctMaterials);
  for( INDEX iMat=0; iMat<ctMaterials; iMat++)
  {
    osc.osc_aomtMaterials[iMat] = CObjectMaterial( mesh.m_materials[iMat].cm_strName);
    osc.osc_aomtMaterials[iMat].omt_Color = mesh.m_materials[iMat].cm_colColor;
  }

  // ------------ Edges and polygons
  INDEX ctTriangles = mesh.m_triangles.size();
  CObjectPolygon *popo = osc.osc_aopoPolygons.New(ctTriangles);
  CObjectPlane *popl = osc.osc_aoplPlanes.New(ctTriangles);
  // we need 3 edges for each polygon
  CObjectEdge *poedg = osc.osc_aoedEdges.New(ctTriangles*3);
  for(INDEX iTri=0; iTri<ctTriangles; iTri++)
  {
    // obtain triangle's vertices
    CObjectVertex *pVtx0 = &osc.osc_aovxVertices[ mesh.m_triangles[iTri].ct_iVtx[0]];
    CObjectVertex *pVtx1 = &osc.osc_aovxVertices[ mesh.m_triangles[iTri].ct_iVtx[1]];
    CObjectVertex *pVtx2 = &osc.osc_aovxVertices[ mesh.m_triangles[iTri].ct_iVtx[2]];

    // create edges
    poedg[iTri*3+0] = CObjectEdge( *pVtx0, *pVtx1);
    poedg[iTri*3+1] = CObjectEdge( *pVtx1, *pVtx2);
    poedg[iTri*3+2] = CObjectEdge( *pVtx2, *pVtx0);

    // create polygon edges
    popo[iTri].opo_PolygonEdges.New(3);
    popo[iTri].opo_PolygonEdges.Lock();
    popo[iTri].opo_PolygonEdges[0].ope_Edge = &poedg[iTri*3+0];
    popo[iTri].opo_PolygonEdges[1].ope_Edge = &poedg[iTri*3+1];
    popo[iTri].opo_PolygonEdges[2].ope_Edge = &poedg[iTri*3+2];
    popo[iTri].opo_PolygonEdges.Unlock();

    // set material
    popo[iTri].opo_Material = &osc.osc_aomtMaterials[ mesh.m_triangles[iTri].ct_iMaterial];
    popo[iTri].opo_colorColor = popo[iTri].opo_Material->omt_Color;

    // create and set plane
    popl[iTri] = DOUBLEplane3D( *pVtx0, *pVtx1, *pVtx2);
    popo[iTri].opo_Plane = &popl[iTri];


    // copy UV coordinates to polygon texture mapping
    CMappingVectors mappingVectors;
    mappingVectors.FromPlane_DOUBLE(popl[iTri]);
    CMappingDefinition defaultMapping;
    FLOAT2D p0_uv = defaultMapping.GetTextureCoordinates(mappingVectors, DOUBLEtoFLOAT(*pVtx0));
    FLOAT2D p1_uv = defaultMapping.GetTextureCoordinates(mappingVectors, DOUBLEtoFLOAT(*pVtx1));
    FLOAT2D p2_uv = defaultMapping.GetTextureCoordinates(mappingVectors, DOUBLEtoFLOAT(*pVtx2));

    for (size_t uvIndex = 0; uvIndex < 3; ++uvIndex)
    {
      const auto& uvmap = mesh.m_uvs[uvIndex];
      if (uvmap.empty())
        continue;

      FLOAT2D p0_uvTarget(
        +uvmap[mesh.m_triangles[iTri].ct_iTVtx[uvIndex][0]](1),
        -uvmap[mesh.m_triangles[iTri].ct_iTVtx[uvIndex][0]](2));
      FLOAT2D p1_uvTarget(
        +uvmap[mesh.m_triangles[iTri].ct_iTVtx[uvIndex][1]](1),
        -uvmap[mesh.m_triangles[iTri].ct_iTVtx[uvIndex][1]](2));
      FLOAT2D p2_uvTarget(
        +uvmap[mesh.m_triangles[iTri].ct_iTVtx[uvIndex][2]](1),
        -uvmap[mesh.m_triangles[iTri].ct_iTVtx[uvIndex][2]](2));

      popo[iTri].opo_amdMappings[uvIndex] = GetMappingDefinitionFromReferenceToTarget({ p0_uv, p1_uv, p2_uv }, { p0_uvTarget, p1_uvTarget, p2_uvTarget });
    }
  }
}
