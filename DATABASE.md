# NOVA Database Access Guide

Your store uses **SQLite**. The database file is:

```
c:\Users\zohar\OneDrive\Desktop\projecto\data\nova.db
```

## Option 1: DB Browser for SQLite (recommended)

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the app → **Open Database**
3. Select `data\nova.db` from this project folder
4. Use the **Browse Data** tab to view/edit tables

## Option 2: VS Code / Cursor extension

1. Install the **SQLite Viewer** or **SQLite** extension
2. Right-click `data/nova.db` → Open Database

## Option 3: Command line

```powershell
cd "c:\Users\zohar\OneDrive\Desktop\projecto"
sqlite3 data\nova.db
```

Example queries:

```sql
.tables
SELECT * FROM users;
SELECT * FROM orders ORDER BY created_at DESC;
SELECT * FROM products;
```

## Tables

| Table | Contents |
|-------|----------|
| `users` | Accounts (passwords are hashed — never plain text) |
| `products` | Catalog |
| `cart_items` | Saved carts per user |
| `orders` | Orders with payment & status |
| `order_items` | Line items per order |

## Important

- **Stop the server** before copying or replacing `nova.db` to avoid corruption.
- Do not delete the `nova.db-wal` or `nova.db-shm` files while the server is running.
- Back up `data\nova.db` regularly for production use.
