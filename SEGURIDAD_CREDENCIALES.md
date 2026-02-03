# ⚠️ SEGURIDAD - CREDENCIALES

## ✅ Archivos Seguros

Los siguientes archivos están protegidos y NO se suben a GitHub:

- `.env` - Protegido por `.gitignore`
- `.env.backup` - Protegido por `.gitignore`
- `.env.production` - Protegido por `.gitignore`

## 🔐 Credenciales del VPS

**NUNCA incluir en el código:**
- IP del servidor
- Contraseñas
- Tokens de acceso
- Claves privadas

## ✅ Uso Correcto de Credenciales

### GitHub Secrets (Recomendado)
```
Settings → Secrets → Actions → New secret

VPS_HOST: [Tu IP]
VPS_USER: [Tu usuario]
VPS_PASSWORD: [Tu contraseña]
```

### Variables de Entorno
```bash
# En el servidor VPS
nano /var/www/epos-final/.env

# Agregar credenciales solo en el servidor
DB_PASSWORD=tu_password_real
MERCADOPAGO_ACCESS_TOKEN=tu_token_real
```

## 🚨 Si Expusiste Credenciales

### 1. Cambiar contraseñas inmediatamente
```bash
ssh root@TU_IP
passwd root
```

### 2. Rotar tokens
- MercadoPago: Generar nuevos tokens
- AFIP: Regenerar certificados
- API Keys: Crear nuevas

### 3. Limpiar historial de Git (si es necesario)
```bash
# Usar BFG Repo-Cleaner o git-filter-repo
git filter-repo --invert-paths --path .env
```

## ✅ Checklist de Seguridad

- [ ] `.env` en `.gitignore`
- [ ] Credenciales solo en GitHub Secrets
- [ ] Documentación sin contraseñas
- [ ] Tokens de prueba en desarrollo
- [ ] Firewall configurado en VPS
- [ ] SSH con keys en lugar de password
- [ ] Contraseñas fuertes y únicas

## 📝 Buenas Prácticas

1. **Usar variables de entorno** para todo lo sensible
2. **GitHub Secrets** para CI/CD
3. **Nunca commitear** archivos con credenciales
4. **Revisar antes de push** con `git diff`
5. **Usar .env.example** con valores de ejemplo

---

**Estado**: ✅ Credenciales protegidas
**Última revisión**: 2024-02-03
