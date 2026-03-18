# NORTHWIND — Employee Performance Dashboard (1997)

## Employee of the Year — Margaret Peacock

| Metric | Value | Rank |
|--------|------:|-----:|
| Revenue | $128,810 | #1 |
| Orders | 81 | #1 |
| Customers | 57 | #1 |
| Product Breadth | 67 | #1 |
| Customer Retention | 31.6% | #1 |

The clear 1997 winner — leading every volume and relationship metric.
Peacock sells the widest range of products and retains more customers than anyone else.

---

## At a Glance

```
                    Revenue                         Total      Orders  Avg Order  Customers  Disc%
Margaret Peacock    ██████████████████████████████  $128,810   81      $1,590     57         6.7%
Janet Leverling     █████████████████████████       $108,026   71      $1,522     46         4.1%
Nancy Davolio       █████████████████████           $93,148    55      $1,694     40         4.6%
Andrew Fuller       ████████████████                $70,444    41      $1,718     35         3.9%
Robert King         ██████████████                  $60,471    36      $1,680     30         7.5%
Laura Callahan      █████████████                   $56,033    54      $1,038     36         7.5%
Michael Suyama      ██████████                      $43,126    33      $1,307     24         6.9%
Steven Buchanan     ███████                         $30,716    18      $1,706     13         6.3%
Anne Dodsworth      ██████                          $26,310    19      $1,385     16         9.0%

█ = revenue (scaled)
```

## Key Insights

- **Margaret Peacock — Volume Leader:** Most orders (81), customers (57), and products sold (67). Drives revenue through breadth and retention (31.6%).
- **Andrew Fuller — Margin Champion:** Lowest discount (3.9%) with the highest avg order ($1,718). Sells on value, not price.
- **Laura Callahan — Volume Without Value:** 54 orders (4th) but lowest avg order size ($1,038) and high discount (7.5%). Needs upselling coaching.
- **Anne Dodsworth — Discount Concern:** Highest discount rate (9.0%) and lowest revenue. Discounting isn't driving volume.
- **Nancy Davolio — Quiet Performer:** #3 revenue with strong avg order ($1,694), low discount (4.6%), and high retention (30.0%).
- **Robert King — Territory Paradox:** Most territories (10) but only 30 customers. Spread too thin?

---

## Metrics Framework

| Layer | Metric | Description |
|-------|--------|-------------|
| **Output** | Total Revenue | quantity x unit price x (1 - discount) per order line |
| Throughput | Orders | Number of orders handled |
| Throughput | Avg Order Size | Revenue per order (upselling indicator) |
| Throughput | Customers | Distinct customers served (breadth indicator) |
| Throughput | Avg Discount % | Average discount given (margin discipline) |
| Input | Product Breadth | Distinct products sold (cross-selling effort) |
| Input | Customer Retention | % of customers also served in prior year (relationship building) |
| Input | Order Frequency | Orders per customer (engagement depth) |
| Input | Territory Coverage | Territories assigned (reach) |

### Input → Output Correlation

How strongly does each metric correlate with revenue? (Pearson r, n=9 employees)

```
Metric                r        Strength
Customers             +0.97    ████████████████████████████████████████  very strong
Orders                +0.95    ███████████████████████████████████████   very strong
Product Breadth       +0.90    █████████████████████████████████████     very strong
Customer Retention    +0.70    █████████████████████████████             strong
Avg Discount          -0.54    ██████████████████████                    moderate (negative)
Territory Coverage    -0.59    ████████████████████████                  moderate (negative)
Order Frequency       +0.36    ███████████████                           weak
Avg Order Size        +0.27    ███████████                               weak
```

**What drives revenue:** selling many products to many customers, and keeping them coming back.
**What doesn't help:** more territories (spread too thin) and higher discounts (erodes without adding volume).

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_customer AS (
  SELECT order_key, customer_key
  FROM daana_dw.order_customer_x
  WHERE type_key = 15 AND row_st = 'Y'
),
order_line_order AS (
  SELECT order_line_key, order_key
  FROM daana_dw.order_line_order_x
  WHERE type_key = 72 AND row_st = 'Y'
),
order_line_details AS (
  SELECT order_line_key,
    MAX(CASE WHEN type_key = 55 THEN val_num END) AS quantity,
    MAX(CASE WHEN type_key = 64 THEN val_num END) AS unit_price,
    MAX(CASE WHEN type_key = 62 THEN val_num END) AS discount
  FROM daana_dw.order_line_desc
  WHERE type_key IN (55, 64, 62) AND row_st = 'Y'
  GROUP BY order_line_key
),
order_line_product AS (
  SELECT order_line_key, product_key
  FROM daana_dw.order_line_product_x
  WHERE type_key = 28 AND row_st = 'Y'
),
employee_territory AS (
  SELECT employee_key, territory_key
  FROM daana_dw.employee_territory_x
  WHERE type_key = 26 AND row_st = 'Y'
),
prev_year_customers AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM order_employee oe
  JOIN daana_dw.order_desc od ON oe.order_key = od.order_key
    AND od.type_key = 3 AND od.row_st = 'Y'
    AND od.sta_tmstp >= '1996-01-01' AND od.sta_tmstp < '1997-01-01'
  JOIN order_customer oc ON oe.order_key = oc.order_key
),
curr_year_customers AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM order_employee oe
  JOIN order_dates od ON oe.order_key = od.order_key
  JOIN order_customer oc ON oe.order_key = oc.order_key
),
employee_metrics AS (
  SELECT
    en.employee_key,
    SUM(old.quantity * old.unit_price * (1 - old.discount)) AS total_revenue,
    COUNT(DISTINCT oe.order_key) AS orders,
    SUM(old.quantity * old.unit_price * (1 - old.discount))
      / COUNT(DISTINCT oe.order_key) AS avg_order_size,
    COUNT(DISTINCT oc.customer_key) AS customers,
    AVG(old.discount) AS avg_discount,
    COUNT(DISTINCT olp.product_key) AS product_breadth,
    COUNT(DISTINCT et.territory_key) AS territories
  FROM employee_names en
  JOIN order_employee oe ON en.employee_key = oe.employee_key
  JOIN order_dates od ON oe.order_key = od.order_key
  JOIN order_line_order olo ON oe.order_key = olo.order_key
  JOIN order_line_details old ON olo.order_line_key = old.order_line_key
  JOIN order_customer oc ON oe.order_key = oc.order_key
  JOIN order_line_product olp ON olo.order_line_key = olp.order_line_key
  LEFT JOIN employee_territory et ON en.employee_key = et.employee_key
  GROUP BY en.employee_key
),
retention AS (
  SELECT
    cyc.employee_key,
    100.0 * COUNT(DISTINCT CASE WHEN pyc.customer_key IS NOT NULL
      THEN cyc.customer_key END)
      / NULLIF(COUNT(DISTINCT cyc.customer_key), 0) AS retention_pct
  FROM curr_year_customers cyc
  LEFT JOIN prev_year_customers pyc
    ON cyc.employee_key = pyc.employee_key
    AND cyc.customer_key = pyc.customer_key
  GROUP BY cyc.employee_key
),
combined AS (
  SELECT em.*, r.retention_pct,
    em.orders::numeric / NULLIF(em.customers, 0) AS order_frequency
  FROM employee_metrics em
  JOIN retention r ON em.employee_key = r.employee_key
)
SELECT
  ROUND(CORR(total_revenue, orders)::numeric, 2) AS r_orders,
  ROUND(CORR(total_revenue, avg_order_size)::numeric, 2) AS r_avg_order,
  ROUND(CORR(total_revenue, customers)::numeric, 2) AS r_customers,
  ROUND(CORR(total_revenue, avg_discount)::numeric, 2) AS r_discount,
  ROUND(CORR(total_revenue, product_breadth)::numeric, 2) AS r_products,
  ROUND(CORR(total_revenue, retention_pct)::numeric, 2) AS r_retention,
  ROUND(CORR(total_revenue, order_frequency)::numeric, 2) AS r_frequency,
  ROUND(CORR(total_revenue, territories)::numeric, 2) AS r_territories
FROM combined
```

</details>

---

## Total Revenue (Output)

```
Margaret Peacock    $128,810  ████████████████████████████████████████
Janet Leverling     $108,026  █████████████████████████████████
Nancy Davolio        $93,148  ████████████████████████████
Andrew Fuller        $70,444  █████████████████████
Robert King          $60,471  ██████████████████
Laura Callahan       $56,033  █████████████████
Michael Suyama       $43,126  █████████████
Steven Buchanan      $30,716  █████████
Anne Dodsworth       $26,310  ████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_line_order AS (
  SELECT order_line_key, order_key
  FROM daana_dw.order_line_order_x
  WHERE type_key = 72 AND row_st = 'Y'
),
order_line_details AS (
  SELECT order_line_key,
    MAX(CASE WHEN type_key = 55 THEN val_num END) AS quantity,
    MAX(CASE WHEN type_key = 64 THEN val_num END) AS unit_price,
    MAX(CASE WHEN type_key = 62 THEN val_num END) AS discount
  FROM daana_dw.order_line_desc
  WHERE type_key IN (55, 64, 62) AND row_st = 'Y'
  GROUP BY order_line_key
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  ROUND(SUM(old.quantity * old.unit_price * (1 - old.discount))::numeric, 2) AS total_revenue
FROM employee_names en
JOIN order_employee oe ON en.employee_key = oe.employee_key
JOIN order_dates od ON oe.order_key = od.order_key
JOIN order_line_order olo ON oe.order_key = olo.order_key
JOIN order_line_details old ON olo.order_line_key = old.order_line_key
GROUP BY en.first_name, en.last_name
ORDER BY total_revenue DESC
```

</details>

---

## Orders Handled (Throughput)

```
Margaret Peacock    81  ████████████████████████████████████████
Janet Leverling     71  ███████████████████████████████████
Nancy Davolio       55  ███████████████████████████
Laura Callahan      54  ██████████████████████████
Andrew Fuller       41  ████████████████████
Robert King         36  █████████████████
Michael Suyama      33  ████████████████
Anne Dodsworth      19  █████████
Steven Buchanan     18  ████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  COUNT(DISTINCT oe.order_key) AS orders
FROM employee_names en
JOIN order_employee oe ON en.employee_key = oe.employee_key
JOIN order_dates od ON oe.order_key = od.order_key
GROUP BY en.first_name, en.last_name
ORDER BY orders DESC
```

</details>

---

## Avg Order Size (Throughput)

```
Andrew Fuller       $1,718  ████████████████████████████████████████
Steven Buchanan     $1,706  ███████████████████████████████████████
Nancy Davolio       $1,694  ███████████████████████████████████████
Robert King         $1,680  ██████████████████████████████████████
Margaret Peacock    $1,590  ████████████████████████████████████
Janet Leverling     $1,522  ███████████████████████████████████
Anne Dodsworth      $1,385  ████████████████████████████████
Michael Suyama      $1,307  ██████████████████████████████
Laura Callahan      $1,038  ████████████████████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_line_order AS (
  SELECT order_line_key, order_key
  FROM daana_dw.order_line_order_x
  WHERE type_key = 72 AND row_st = 'Y'
),
order_line_details AS (
  SELECT order_line_key,
    MAX(CASE WHEN type_key = 55 THEN val_num END) AS quantity,
    MAX(CASE WHEN type_key = 64 THEN val_num END) AS unit_price,
    MAX(CASE WHEN type_key = 62 THEN val_num END) AS discount
  FROM daana_dw.order_line_desc
  WHERE type_key IN (55, 64, 62) AND row_st = 'Y'
  GROUP BY order_line_key
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  ROUND((SUM(old.quantity * old.unit_price * (1 - old.discount))
    / COUNT(DISTINCT oe.order_key))::numeric, 2) AS avg_order_size
FROM employee_names en
JOIN order_employee oe ON en.employee_key = oe.employee_key
JOIN order_dates od ON oe.order_key = od.order_key
JOIN order_line_order olo ON oe.order_key = olo.order_key
JOIN order_line_details old ON olo.order_line_key = old.order_line_key
GROUP BY en.first_name, en.last_name
ORDER BY avg_order_size DESC
```

</details>

---

## Customers Served (Throughput)

```
Margaret Peacock    57  ████████████████████████████████████████
Janet Leverling     46  ████████████████████████████████
Nancy Davolio       40  ████████████████████████████
Laura Callahan      36  █████████████████████████
Andrew Fuller       35  ████████████████████████
Robert King         30  █████████████████████
Michael Suyama      24  ████████████████
Anne Dodsworth      16  ███████████
Steven Buchanan     13  █████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_customer AS (
  SELECT order_key, customer_key
  FROM daana_dw.order_customer_x
  WHERE type_key = 15 AND row_st = 'Y'
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  COUNT(DISTINCT oc.customer_key) AS customers
FROM employee_names en
JOIN order_employee oe ON en.employee_key = oe.employee_key
JOIN order_dates od ON oe.order_key = od.order_key
JOIN order_customer oc ON oe.order_key = oc.order_key
GROUP BY en.first_name, en.last_name
ORDER BY customers DESC
```

</details>

---

## Avg Discount % (Throughput)

Lower is better — indicates margin discipline.

```
Andrew Fuller       3.9%  █████████████████
Janet Leverling     4.1%  ██████████████████
Nancy Davolio       4.6%  ████████████████████
Steven Buchanan     6.3%  ████████████████████████████
Margaret Peacock    6.7%  █████████████████████████████
Michael Suyama      6.9%  ██████████████████████████████
Laura Callahan      7.5%  █████████████████████████████████
Robert King         7.5%  █████████████████████████████████
Anne Dodsworth      9.0%  ████████████████████████████████████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_line_order AS (
  SELECT order_line_key, order_key
  FROM daana_dw.order_line_order_x
  WHERE type_key = 72 AND row_st = 'Y'
),
order_line_details AS (
  SELECT order_line_key,
    MAX(CASE WHEN type_key = 62 THEN val_num END) AS discount
  FROM daana_dw.order_line_desc
  WHERE type_key = 62 AND row_st = 'Y'
  GROUP BY order_line_key
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  ROUND(AVG(old.discount)::numeric * 100, 1) AS avg_discount_pct
FROM employee_names en
JOIN order_employee oe ON en.employee_key = oe.employee_key
JOIN order_dates od ON oe.order_key = od.order_key
JOIN order_line_order olo ON oe.order_key = olo.order_key
JOIN order_line_details old ON olo.order_line_key = old.order_line_key
GROUP BY en.first_name, en.last_name
ORDER BY avg_discount_pct ASC
```

</details>

---

## Product Breadth (Input)

Distinct products sold — measures cross-selling effort.

```
Margaret Peacock    67  ████████████████████████████████████████
Janet Leverling     67  ████████████████████████████████████████
Nancy Davolio       63  █████████████████████████████████████
Laura Callahan      57  ██████████████████████████████████
Andrew Fuller       55  ████████████████████████████████
Robert King         54  ████████████████████████████████
Michael Suyama      51  ██████████████████████████████
Steven Buchanan     37  ██████████████████████
Anne Dodsworth      30  █████████████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_line_order AS (
  SELECT order_line_key, order_key
  FROM daana_dw.order_line_order_x
  WHERE type_key = 72 AND row_st = 'Y'
),
order_line_product AS (
  SELECT order_line_key, product_key
  FROM daana_dw.order_line_product_x
  WHERE type_key = 28 AND row_st = 'Y'
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  COUNT(DISTINCT olp.product_key) AS distinct_products
FROM employee_names en
JOIN order_employee oe ON en.employee_key = oe.employee_key
JOIN order_dates od ON oe.order_key = od.order_key
JOIN order_line_order olo ON oe.order_key = olo.order_key
JOIN order_line_product olp ON olo.order_line_key = olp.order_line_key
GROUP BY en.first_name, en.last_name
ORDER BY distinct_products DESC
```

</details>

---

## Customer Retention (Input)

% of 1997 customers who were also served in 1996 — measures relationship building.

```
Margaret Peacock    31.6%  ████████████████████████████████████████
Nancy Davolio       30.0%  █████████████████████████████████████
Michael Suyama      29.2%  ████████████████████████████████████
Laura Callahan      22.2%  ████████████████████████████
Janet Leverling     21.7%  ███████████████████████████
Andrew Fuller       20.0%  █████████████████████████
Robert King         13.3%  ████████████████
Steven Buchanan      7.7%  █████████
Anne Dodsworth       6.3%  ███████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_customer AS (
  SELECT order_key, customer_key
  FROM daana_dw.order_customer_x
  WHERE type_key = 15 AND row_st = 'Y'
),
prev_year_customers AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM order_employee oe
  JOIN daana_dw.order_desc od ON oe.order_key = od.order_key
    AND od.type_key = 3 AND od.row_st = 'Y'
    AND od.sta_tmstp >= '1996-01-01' AND od.sta_tmstp < '1997-01-01'
  JOIN order_customer oc ON oe.order_key = oc.order_key
),
curr_year_customers AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM order_employee oe
  JOIN order_dates od ON oe.order_key = od.order_key
  JOIN order_customer oc ON oe.order_key = oc.order_key
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  COUNT(DISTINCT CASE WHEN pyc.customer_key IS NOT NULL
    THEN cyc.customer_key END) AS retained,
  COUNT(DISTINCT cyc.customer_key) AS total,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN pyc.customer_key IS NOT NULL
    THEN cyc.customer_key END)
    / NULLIF(COUNT(DISTINCT cyc.customer_key), 0), 1) AS retention_pct
FROM employee_names en
JOIN curr_year_customers cyc ON en.employee_key = cyc.employee_key
LEFT JOIN prev_year_customers pyc
  ON en.employee_key = pyc.employee_key
  AND cyc.customer_key = pyc.customer_key
GROUP BY en.first_name, en.last_name
ORDER BY retention_pct DESC
```

</details>

---

## Order Frequency (Input)

Orders per customer — measures engagement depth.

```
Janet Leverling     1.5  ████████████████████████████████████████
Laura Callahan      1.5  ████████████████████████████████████████
Margaret Peacock    1.4  █████████████████████████████████████
Nancy Davolio       1.4  █████████████████████████████████████
Michael Suyama      1.4  █████████████████████████████████████
Steven Buchanan     1.4  █████████████████████████████████████
Andrew Fuller       1.2  ████████████████████████████████
Anne Dodsworth      1.2  ████████████████████████████████
Robert King         1.2  ████████████████████████████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
order_dates AS (
  SELECT order_key
  FROM daana_dw.order_desc
  WHERE type_key = 3 AND row_st = 'Y'
    AND sta_tmstp >= '1997-01-01' AND sta_tmstp < '1998-01-01'
),
order_customer AS (
  SELECT order_key, customer_key
  FROM daana_dw.order_customer_x
  WHERE type_key = 15 AND row_st = 'Y'
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  ROUND(COUNT(DISTINCT oe.order_key)::numeric
    / NULLIF(COUNT(DISTINCT oc.customer_key), 0), 1) AS orders_per_customer
FROM employee_names en
JOIN order_employee oe ON en.employee_key = oe.employee_key
JOIN order_dates od ON oe.order_key = od.order_key
JOIN order_customer oc ON oe.order_key = oc.order_key
GROUP BY en.first_name, en.last_name
ORDER BY orders_per_customer DESC
```

</details>

---

## Territory Coverage (Input)

Territories assigned per employee.

```
Robert King         10  ████████████████████████████████████████
Anne Dodsworth       7  ████████████████████████████
Andrew Fuller        7  ████████████████████████████
Steven Buchanan      7  ████████████████████████████
Michael Suyama       5  ████████████████████
Janet Leverling      4  ████████████████
Laura Callahan       4  ████████████████
Margaret Peacock     3  ████████████
Nancy Davolio        2  ████████
```

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10) AND row_st = 'Y'
  GROUP BY employee_key
),
employee_territory AS (
  SELECT employee_key, territory_key
  FROM daana_dw.employee_territory_x
  WHERE type_key = 26 AND row_st = 'Y'
)
SELECT
  en.first_name || ' ' || en.last_name AS employee,
  COUNT(DISTINCT et.territory_key) AS territories
FROM employee_names en
LEFT JOIN employee_territory et ON en.employee_key = et.employee_key
GROUP BY en.first_name, en.last_name
ORDER BY territories DESC
```

</details>
