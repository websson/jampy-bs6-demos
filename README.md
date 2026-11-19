# Jam.py Bootstrap 6 demos

Two demo applications for [Jam.py](https://github.com/jam-py-v7/jam-py-v7) running on its Bootstrap 6 interface,
made by Danijel Kaurin of the Jam.py team (November 2026). Hosted here so they can be tried in a browser on
[Uppcoder](https://uppcoder.com/jampy), Jam.py's technology partner.

| Folder | App | Sign in |
|---|---|---|
| `crm/` | CRM: companies, contacts, deals, activities, sales dashboard (DuckDB) | admin / 111 |
| `demo/` | Music Store demo: invoices, customers, tracks, reports (SQLite) | admin / 111 |

Each folder is a complete Jam.py project with the Bootstrap 6 build of Jam.py 7.0.117 in its own `jam/` folder,
which takes precedence over an installed `jam.py-v7` package. To run one locally:

    cd crm            # or demo
    pip install Werkzeug sqlalchemy esprima pyjsparser jsmin sqlparse standard-imghdr jinja2
    pip install -r requirements.txt   # crm only (duckdb)
    python server.py 8080

Jam.py is BSD-3-Clause licensed; the code here is the Jam.py team's work, unchanged apart from removed caches,
logs and lock files.
