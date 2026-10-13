from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.modulos.empresas.modelos import Empresa
from app.modulos.empresas.esquemas import EmpresaCrear, EmpresaActualizar


class ServicioEmpresas:
    @staticmethod
    def obtener_por_id(db: Session, empresa_id: int) -> Empresa:
        empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada."
            )
        return empresa

    @staticmethod
    def crear_empresa(db: Session, datos: EmpresaCrear) -> Empresa:
        existente = db.query(Empresa).filter(
            Empresa.identificador_fiscal == datos.identificador_fiscal
        ).first()

        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una empresa registrada con el identificador fiscal '{datos.identificador_fiscal}'."
            )

        nueva_empresa = Empresa(
            nombre=datos.nombre.strip(),
            identificador_fiscal=datos.identificador_fiscal.strip(),
            direccion=datos.direccion,
            telefono=datos.telefono,
            correo_electronico=datos.correo_electronico,
            moneda=datos.moneda.upper().strip(),
            tasa_impuesto=datos.tasa_impuesto,
            activo=True
        )
        db.add(nueva_empresa)
        db.commit()
        db.refresh(nueva_empresa)
        return nueva_empresa

    @staticmethod
    def actualizar_empresa(db: Session, empresa_id: int, datos: EmpresaActualizar) -> Empresa:
        empresa = ServicioEmpresas.obtener_por_id(db, empresa_id)
        payload = datos.model_dump(exclude_unset=True)

        for campo, valor in payload.items():
            setattr(empresa, campo, valor)

        db.commit()
        db.refresh(empresa)
        return empresa
