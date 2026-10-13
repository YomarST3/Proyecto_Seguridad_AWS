import sys
import os
from decimal import Decimal
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models import (
    Company, Role, User, Employee, Category, Product,
    Inventory, InventoryMovement, Customer, Order, OrderDetail,
    Sale, SaleDetail, PaymentMethod, Payment,
    UserRoleEnum, CustomerTypeEnum, OrderStatusEnum,
    SaleStatusEnum, PaymentStatusEnum, InventoryMovementTypeEnum
)
from app.security.passwords import get_password_hash


def seed_database():
    db = SessionLocal()
    try:
        print("[INFO] Iniciando insercion de datos semilla para SalesIA Enterprise...")
        
        # 1. Verificar si ya existen roles
        if db.query(Role).first():
            print("[INFO] La base de datos ya contiene datos semilla. Omitiendo.")
            return

        # 2. Roles
        roles_data = [
            ("ADMIN", "Administrador integral con acceso a configuración y auditoría"),
            ("MANAGER", "Gerente comercial con acceso a dashboards ejecutivos y reportes"),
            ("SALESPERSON", "Vendedor comercial enfocado en clientes, pedidos y ventas"),
            ("ANALYST", "Analista de datos con acceso a estadística, probabilidades y reportes"),
            ("WAREHOUSE", "Encargado de almacén para gestión de existencias y movimientos")
        ]
        roles_map = {}
        for role_name, desc in roles_data:
            role = Role(name=role_name, description=desc)
            db.add(role)
            db.flush()
            roles_map[role_name] = role

        # 3. Empresa
        company = Company(
            name="SalesIA Tech Solutions S.A.C.",
            tax_id="20608912345",
            address="Av. República de Panamá 3505, San Isidro, Lima",
            phone="+51 1 700 8900",
            email="contacto@salesiatech.com",
            currency="USD",
            tax_rate=Decimal("0.18"),
            is_active=True
        )
        db.add(company)
        db.flush()

        # 4. Métodos de Pago
        payment_methods_data = [
            ("EFECTIVO", False),
            ("TARJETA_DEBITO", True),
            ("TARJETA_CREDITO", True),
            ("TRANSFERENCIA", True)
        ]
        pm_map = {}
        for pm_name, req_ref in payment_methods_data:
            pm = PaymentMethod(name=pm_name, requires_reference=req_ref, is_active=True)
            db.add(pm)
            db.flush()
            pm_map[pm_name] = pm

        # 5. Usuarios
        users_info = [
            ("admin@salesia.com", "admin123", "Administrador General", "ADMIN"),
            ("gerente@salesia.com", "gerente123", "Valeria Quispe (Gerente)", "MANAGER"),
            ("vendedor@salesia.com", "vendedor123", "Carlos Mendoza (Vendedor Sr)", "SALESPERSON"),
            ("analista@salesia.com", "analista123", "Laura Gómez (Analista BI)", "ANALYST"),
            ("almacen@salesia.com", "almacen123", "Jorge Morales (Jefe Bodega)", "WAREHOUSE")
        ]
        users_map = {}
        for email, pwd, name, r_name in users_info:
            usr = User(
                company_id=company.id,
                role_id=roles_map[r_name].id,
                email=email,
                hashed_password=get_password_hash(pwd),
                full_name=name,
                is_active=True
            )
            db.add(usr)
            db.flush()
            users_map[r_name] = usr

        # 6. Empleados
        emp_vendedor = Employee(
            company_id=company.id,
            user_id=users_map["SALESPERSON"].id,
            first_name="Carlos",
            last_name="Mendoza",
            doc_number="45892134",
            email="vendedor@salesia.com",
            phone="+51 987 654 321",
            job_title="Ejecutivo Comercial Senior",
            commission_rate=Decimal("0.05"),
            monthly_sales_target=Decimal("15000.00"),
            is_active=True
        )
        db.add(emp_vendedor)

        emp_gerente = Employee(
            company_id=company.id,
            user_id=users_map["MANAGER"].id,
            first_name="Valeria",
            last_name="Quispe",
            doc_number="41289456",
            email="gerente@salesia.com",
            phone="+51 991 223 344",
            job_title="Gerente de Operaciones Comerciales",
            commission_rate=Decimal("0.02"),
            monthly_sales_target=Decimal("50000.00"),
            is_active=True
        )
        db.add(emp_gerente)
        db.flush()

        # 7. Categorías
        categories_data = [
            ("Laptops & Cómputo", "Equipos portátiles para trabajo, gaming y oficina"),
            ("Monitores & Displays", "Pantallas 4K, ultrafinas y accesorios de visualización"),
            ("Periféricos & Audio", "Teclados mecánicos, ratones y diademas inalámbricas"),
            ("Redes & Conectividad", "Routers Wi-Fi 6, switches y adaptadores empresariales")
        ]
        cats_map = {}
        for cat_name, desc in categories_data:
            cat = Category(company_id=company.id, name=cat_name, description=desc, is_active=True)
            db.add(cat)
            db.flush()
            cats_map[cat_name] = cat

        # 8. Catálogo de Productos y Existencias Iniciales
        products_data = [
            ("LAP-001", "ThinkPad Pro X1 Intel i7 32GB", "Laptops & Cómputo", Decimal("950.00"), Decimal("1450.00"), 25, 5),
            ("LAP-002", "Dell Latitude 5440 Core i5 16GB", "Laptops & Cómputo", Decimal("650.00"), Decimal("990.00"), 40, 8),
            ("MON-001", "Monitor Dell Ultrasharp 27' 4K UHD", "Monitores & Displays", Decimal("320.00"), Decimal("520.00"), 30, 6),
            ("MON-002", "Monitor LG UltraWide 34' Curved", "Monitores & Displays", Decimal("410.00"), Decimal("680.00"), 15, 4),
            ("PER-001", "Logitech MX Master 3S Inalámbrico", "Periféricos & Audio", Decimal("65.00"), Decimal("119.00"), 60, 10),
            ("PER-002", "Teclado Mecánico Keychron K2 Pro", "Periféricos & Audio", Decimal("75.00"), Decimal("135.00"), 35, 8),
            ("RED-001", "Router Cisco Catalyst Wi-Fi 6 AX", "Redes & Conectividad", Decimal("180.00"), Decimal("295.00"), 20, 5),
            ("RED-002", "Switch Gigabit PoE+ Ubiquiti 24P", "Redes & Conectividad", Decimal("240.00"), Decimal("390.00"), 12, 3),
        ]

        products_map = {}
        for sku, name, cat_name, cost, price, initial_qty, min_alert in products_data:
            prod = Product(
                company_id=company.id,
                category_id=cats_map[cat_name].id,
                sku=sku,
                name=name,
                description=f"Especificación oficial para {name}",
                cost_price=cost,
                sale_price=price,
                tax_rate=Decimal("0.18"),
                min_stock_alert=min_alert,
                is_active=True
            )
            db.add(prod)
            db.flush()
            products_map[sku] = prod

            # Crear inventario asociado
            inv = Inventory(
                product_id=prod.id,
                physical_stock=initial_qty,
                reserved_stock=0
            )
            db.add(inv)
            db.flush()

            # Registrar movimiento de entrada de inventario
            mov = InventoryMovement(
                inventory_id=inv.id,
                movement_type=InventoryMovementTypeEnum.ENTRY,
                quantity=initial_qty,
                previous_stock=0,
                resulting_stock=initial_qty,
                reference_doc="INVENTARIO_INICIAL_2026",
                reason="Carga de stock inicial para arranque de operaciones",
                user_id=users_map["ADMIN"].id
            )
            db.add(mov)

        # 9. Clientes Iniciales
        customers_data = [
            (CustomerTypeEnum.JURIDICA, "Corporación Minera del Sur S.A.C.", "RUC", "20556781234", "compras@mineradelSur.com", "+51 1 450 9900", "Av. Javier Prado Este 2450, Lima"),
            (CustomerTypeEnum.JURIDICA, "InnovaTech Consulting Global S.A.", "RUC", "20448912301", "it@innovatech.io", "+51 1 610 8822", "Calle Las Begonias 441, San Isidro"),
            (CustomerTypeEnum.NATURAL, "Mariana Rodríguez Silva", "DNI", "47812904", "m.rodriguez@gmail.com", "+51 984 556 771", "Av. Benavides 1840, Miraflores"),
            (CustomerTypeEnum.NATURAL, "Roberto Palacios Benítez", "DNI", "43198421", "r.palacios@hotmail.com", "+51 972 110 443", "Calle Los Sauces 120, Surco"),
            (CustomerTypeEnum.JURIDICA, "Logística & Transporte Andino S.A.", "RUC", "20339841288", "operaciones@andino.com.pe", "+51 1 315 7800", "Av. Colonial 1490, Callao")
        ]
        customers_list = []
        for ctype, name, dtype, dnum, email, phone, addr in customers_data:
            cust = Customer(
                company_id=company.id,
                customer_type=ctype,
                full_name=name,
                doc_type=dtype,
                doc_number=dnum,
                email=email,
                phone=phone,
                address=addr,
                is_active=True
            )
            db.add(cust)
            db.flush()
            customers_list.append(cust)

        # 10. Operaciones Comerciales Semilla (Ventas con detalle inmutable y pagos)
        now = datetime.utcnow()
        sales_records = [
            (customers_list[0], [("LAP-001", 2), ("MON-001", 2)], now - timedelta(days=12), "EFECTIVO"),
            (customers_list[1], [("LAP-002", 3), ("PER-001", 3), ("PER-002", 3)], now - timedelta(days=9), "TRANSFERENCIA"),
            (customers_list[2], [("LAP-001", 1), ("PER-001", 1)], now - timedelta(days=6), "TARJETA_CREDITO"),
            (customers_list[3], [("MON-002", 1), ("PER-002", 1)], now - timedelta(days=3), "TARJETA_DEBITO"),
            (customers_list[4], [("RED-001", 2), ("RED-002", 1)], now - timedelta(days=1), "TRANSFERENCIA"),
        ]

        sale_counter = 1
        for cust, items, sale_date, pay_method in sales_records:
            sale_code = f"VTA-2026-{sale_counter:04d}"
            subtotal = Decimal("0.00")
            tax_total = Decimal("0.00")
            
            # Crear venta primero para obtener id
            sale = Sale(
                company_id=company.id,
                sale_code=sale_code,
                customer_id=cust.id,
                salesperson_id=emp_vendedor.id,
                status=SaleStatusEnum.CONFIRMED,
                payment_status=PaymentStatusEnum.PAID,
                subtotal=subtotal,
                tax_amount=tax_total,
                discount_amount=Decimal("0.00"),
                total_amount=Decimal("0.00"),
                paid_amount=Decimal("0.00"),
                notes="Venta directa con pago completado",
                created_at=sale_date,
                updated_at=sale_date
            )
            db.add(sale)
            db.flush()

            for sku, qty in items:
                p = products_map[sku]
                line_sub = p.sale_price * qty
                line_tax = line_sub * p.tax_rate
                line_tot = line_sub + line_tax
                
                subtotal += line_sub
                tax_total += line_tax

                detail = SaleDetail(
                    sale_id=sale.id,
                    product_id=p.id,
                    quantity=qty,
                    unit_cost=p.cost_price,
                    unit_price=p.sale_price,
                    tax_rate=p.tax_rate,
                    discount_amount=Decimal("0.00"),
                    line_subtotal=line_sub,
                    line_total=line_tot
                )
                db.add(detail)

                # Descontar existencias físicas reales
                inv = db.query(Inventory).filter(Inventory.product_id == p.id).first()
                if inv:
                    prev_stock = inv.physical_stock
                    inv.physical_stock -= qty
                    mov = InventoryMovement(
                        inventory_id=inv.id,
                        movement_type=InventoryMovementTypeEnum.EXIT,
                        quantity=qty,
                        previous_stock=prev_stock,
                        resulting_stock=inv.physical_stock,
                        reference_doc=sale_code,
                        reason="Salida por venta directa facturada",
                        user_id=users_map["SALESPERSON"].id,
                        created_at=sale_date
                    )
                    db.add(mov)

            grand_total = subtotal + tax_total
            sale.subtotal = subtotal
            sale.tax_amount = tax_total
            sale.total_amount = grand_total
            sale.paid_amount = grand_total

            # Registrar pago completado
            payment = Payment(
                sale_id=sale.id,
                payment_method_id=pm_map[pay_method].id,
                amount=grand_total,
                reference=f"OP-{sale_date.strftime('%Y%m%d')}-{sale_counter:03d}",
                received_by_user_id=users_map["SALESPERSON"].id,
                payment_date=sale_date,
                notes="Pago íntegro recibido en caja"
            )
            db.add(payment)
            sale_counter += 1

        db.commit()
        print("[SUCCESS] Datos semilla cargados con exito: Empresa, Roles, Usuarios, Catalogo, Existencias y Operaciones.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error al cargar datos semilla: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
