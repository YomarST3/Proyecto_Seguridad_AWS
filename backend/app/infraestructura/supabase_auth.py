import uuid
import time
import json
import urllib.request
from typing import Optional, List, Callable, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session

from app.nucleo.base_datos import obtener_sesion_db
from app.nucleo.configuracion import configuracion
from app.modulos.usuarios.modelos import Usuario
from app.modulos.usuarios.servicios import ServicioUsuarios

portador_seguridad = HTTPBearer(auto_error=False)

# Cache de claves públicas JWKS de Supabase con soporte de rotación de claves
_jwks_cache: Dict[str, Any] = {
    "keys": {},      # kid -> jwk.Key
    "raw_keys": [],  # lista de dicts crudos
    "fetched_at": 0.0
}
CACHE_TTL_SECONDS = 3600  # 1 hora


def refrescar_claves_jwks(forzar: bool = False) -> Dict[str, Any]:
    """Descarga e indexa el conjunto de claves públicas (JWKS) emitidas por Supabase."""
    global _jwks_cache
    ahora = time.time()

    if not forzar and _jwks_cache["keys"] and (ahora - _jwks_cache["fetched_at"] < CACHE_TTL_SECONDS):
        return _jwks_cache["keys"]

    jwks_url = configuracion.SUPABASE_JWT_JWKS_URL
    if not jwks_url:
        return _jwks_cache["keys"]

    try:
        req = urllib.request.Request(
            jwks_url,
            headers={"User-Agent": "SalesIA-Enterprise-FastAPI"}
        )
        with urllib.request.urlopen(req, timeout=5) as respuesta:
            data = json.loads(respuesta.read().decode("utf-8"))

        keys_by_kid = {}
        raw_keys = data.get("keys", [])
        for k in raw_keys:
            try:
                constructed = jwk.construct(k)
                if "kid" in k:
                    keys_by_kid[k["kid"]] = constructed
                # También indexar por algoritmo si no existe
                if "alg" in k and k["alg"] not in keys_by_kid:
                    keys_by_kid[k["alg"]] = constructed
            except Exception:
                continue

        _jwks_cache["keys"] = keys_by_kid
        _jwks_cache["raw_keys"] = raw_keys
        _jwks_cache["fetched_at"] = ahora
        return keys_by_kid
    except Exception:
        # En caso de error de red, mantener las claves cacheadas previamente
        if _jwks_cache["keys"]:
            return _jwks_cache["keys"]
        return {}


def decodificar_token_supabase(token: str) -> dict:
    """
    Verifica criptográficamente y decodifica un JWT emitido por Supabase Auth (GoTrue).
    Soporta:
      1. Claves asimétricas (ES256, RS256) verificadas contra JWKS oficial con soporte de rotación.
      2. Algoritmo simétrico (HS256) con SUPABASE_JWT_SECRET para entornos de prueba y locales.
    Valida firma, expiración (exp) y emisor (iss).
    """
    if not token or not isinstance(token, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acceso no proporcionado o con formato inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        header = jwt.get_unverified_header(token)
    except JWTError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Encabezado del token JWT malformado: {str(err)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = header.get("alg", "HS256")
    kid = header.get("kid")

    # Caso 1: Firma asimétrica (ES256 / RS256 con JWKS de Supabase)
    if alg in ["ES256", "RS256", "PS256", "ES384", "ES512"] or kid is not None:
        keys_cache = refrescar_claves_jwks(forzar=False)
        key = None

        if kid and kid in keys_cache:
            key = keys_cache[kid]
        elif not kid and alg in keys_cache:
            key = keys_cache[alg]
        else:
            # Clave no encontrada en cache; forzar actualización por si hubo rotación
            keys_cache = refrescar_claves_jwks(forzar=True)
            if kid and kid in keys_cache:
                key = keys_cache[kid]
            elif alg in keys_cache:
                key = keys_cache[alg]

        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Firma no verificable: clave pública (kid: '{kid}', alg: '{alg}') no disponible en JWKS de Supabase.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            payload = jwt.decode(
                token,
                key,
                algorithms=[alg],
                options={"verify_aud": False}
            )
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La sesión ha expirado. Por favor, inicie sesión nuevamente.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError as err:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Firma criptográfica de Supabase inválida: {str(err)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Caso 2: Firma simétrica (HS256 para entorno de prueba o clave compartida)
    elif alg == "HS256":
        try:
            payload = jwt.decode(
                token,
                configuracion.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La sesión ha expirado. Por favor, inicie sesión nuevamente.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError as err:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Firma criptográfica inválida o token alterado: {str(err)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Algoritmo de token '{alg}' no soportado por la política de seguridad.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validación explícita de expiración (exp)
    exp = payload.get("exp")
    if exp is not None:
        try:
            if int(time.time()) > int(exp):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="La sesión ha expirado. Por favor, inicie sesión nuevamente.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Formato de claim 'exp' inválido en el token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Validación adicional de emisor si está configurado en Supabase
    iss = payload.get("iss")
    if iss and configuracion.SUPABASE_URL:
        base_iss = configuracion.SUPABASE_URL.rstrip("/")
        if not (iss.startswith(base_iss) or "supabase.co" in iss or "localhost" in iss):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Emisor (iss) del token de autenticación no reconocido para este entorno.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return payload


def obtener_usuario_autenticado(
    credenciales: Optional[HTTPAuthorizationCredentials] = Depends(portador_seguridad),
    db: Session = Depends(obtener_sesion_db)
) -> Usuario:
    """Extrae el usuario autenticado a partir del JWT de Supabase."""
    if not credenciales:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no proporcionadas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credenciales.credentials
    payload = decodificar_token_supabase(token)
    
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token no contiene un identificador de usuario válido (sub).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        usuario_uuid = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de identificador de usuario UUID inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_uuid,
        Usuario.activo == True
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario no registrado en la empresa o se encuentra inactivo."
        )

    return usuario


def requerir_permiso(codigo_permiso: str) -> Callable:
    """Inyector de dependencias para autorización RBAC basada en permisos granulares."""
    def verificador_permiso(
        usuario: Usuario = Depends(obtener_usuario_autenticado),
        db: Session = Depends(obtener_sesion_db)
    ) -> Usuario:
        permisos_usuario = ServicioUsuarios.obtener_codigos_permisos(db, usuario.id)

        # Si el usuario tiene el permiso específico o posee rol de administrador total
        if codigo_permiso in permisos_usuario or "empresas:configurar" in permisos_usuario:
            return usuario

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acceso denegado: Se requiere el permiso '{codigo_permiso}' para ejecutar esta acción."
        )

    return verificador_permiso
