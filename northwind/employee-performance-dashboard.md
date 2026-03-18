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
Order Frequency       +0.43    █████████████████                         moderate
Avg Order Size        +0.27    ███████████                               weak
Avg Discount          -0.53    ██████████████████████                    moderate (negative)
Territory Coverage    -0.59    ████████████████████████                  moderate (negative)
```

**What drives revenue:** selling many products to many customers, and keeping them coming back.
**What doesn't help:** more territories (spread too thin) and higher discounts (erodes without adding volume).

<details>
<summary>Show prompt</summary>

> Pearson correlation of each employee metric (orders, avg order size, customers, avg discount, product breadth, customer retention, order frequency, territories) with total revenue across all 9 employees for 1997.

</details>

<details>
<summary>Show query</summary>

```sql
WITH
order_metrics AS (
  SELECT
    oe.employee_key,
    COUNT(DISTINCT oe.order_key) AS orders,
    SUM(old.val_num * olq.val_num * (1 - COALESCE(oldisc.val_num, 0))) AS total_revenue,
    COUNT(DISTINCT oc.customer_key) AS customers,
    AVG(oldisc.val_num) AS avg_discount,
    COUNT(DISTINCT olp.product_key) AS product_breadth
  FROM daana_dw.order_employee_x oe
  JOIN daana_dw.order_desc od
    ON oe.order_key = od.order_key
    AND od.type_key = 3 AND od.row_st = 'Y'
    AND od.sta_tmstp >= CAST('1997-01-01' AS TIMESTAMP)
    AND od.sta_tmstp < CAST('1998-01-01' AS TIMESTAMP)
  JOIN daana_dw.order_customer_x oc
    ON oe.order_key = oc.order_key
    AND oc.type_key = 15 AND oc.row_st = 'Y'
  JOIN daana_dw.order_line_order_x olo
    ON oe.order_key = olo.order_key
    AND olo.type_key = 72 AND olo.row_st = 'Y'
  JOIN daana_dw.order_line_desc old
    ON olo.order_line_key = old.order_line_key
    AND old.type_key = 64 AND old.row_st = 'Y'
  JOIN daana_dw.order_line_desc olq
    ON olo.order_line_key = olq.order_line_key
    AND olq.type_key = 55 AND olq.row_st = 'Y'
  LEFT JOIN daana_dw.order_line_desc oldisc
    ON olo.order_line_key = oldisc.order_line_key
    AND oldisc.type_key = 62 AND oldisc.row_st = 'Y'
  LEFT JOIN daana_dw.order_line_product_x olp
    ON olo.order_line_key = olp.order_line_key
    AND olp.type_key = 28 AND olp.row_st = 'Y'
  WHERE oe.type_key = 5 AND oe.row_st = 'Y'
  GROUP BY oe.employee_key
),
order_metrics_ext AS (
  SELECT
    employee_key, orders, total_revenue,
    total_revenue / NULLIF(orders, 0) AS avg_order_size,
    customers, avg_discount, product_breadth,
    orders::FLOAT / NULLIF(customers, 0) AS order_frequency
  FROM order_metrics
),
territory_metrics AS (
  SELECT et.employee_key, COUNT(DISTINCT et.territory_key) AS territories
  FROM daana_dw.employee_territory_x et
  WHERE et.type_key = 26 AND et.row_st = 'Y'
  GROUP BY et.employee_key
),
customers_1996 AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM daana_dw.order_employee_x oe
  JOIN daana_dw.order_desc od
    ON oe.order_key = od.order_key
    AND od.type_key = 3 AND od.row_st = 'Y'
    AND od.sta_tmstp >= CAST('1996-01-01' AS TIMESTAMP)
    AND od.sta_tmstp < CAST('1997-01-01' AS TIMESTAMP)
  JOIN daana_dw.order_customer_x oc
    ON oe.order_key = oc.order_key AND oc.type_key = 15 AND oc.row_st = 'Y'
  WHERE oe.type_key = 5 AND oe.row_st = 'Y'
),
customers_1997 AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM daana_dw.order_employee_x oe
  JOIN daana_dw.order_desc od
    ON oe.order_key = od.order_key
    AND od.type_key = 3 AND od.row_st = 'Y'
    AND od.sta_tmstp >= CAST('1997-01-01' AS TIMESTAMP)
    AND od.sta_tmstp < CAST('1998-01-01' AS TIMESTAMP)
  JOIN daana_dw.order_customer_x oc
    ON oe.order_key = oc.order_key AND oc.type_key = 15 AND oc.row_st = 'Y'
  WHERE oe.type_key = 5 AND oe.row_st = 'Y'
),
retention_metrics AS (
  SELECT c97.employee_key,
    COUNT(DISTINCT CASE WHEN c96.customer_key IS NOT NULL THEN c97.customer_key END)::FLOAT
      / NULLIF(COUNT(DISTINCT c97.customer_key), 0) AS customer_retention
  FROM customers_1997 c97
  LEFT JOIN customers_1996 c96
    ON c97.employee_key = c96.employee_key AND c97.customer_key = c96.customer_key
  GROUP BY c97.employee_key
),
combined AS (
  SELECT om.*, COALESCE(tm.territories, 0) AS territories,
    COALESCE(rm.customer_retention, 0) AS customer_retention
  FROM order_metrics_ext om
  LEFT JOIN territory_metrics tm ON om.employee_key = tm.employee_key
  LEFT JOIN retention_metrics rm ON om.employee_key = rm.employee_key
)
SELECT 'orders' AS metric, ROUND(CORR(orders, total_revenue)::NUMERIC, 2) AS pearson_r FROM combined
UNION ALL SELECT 'avg_order_size', ROUND(CORR(avg_order_size, total_revenue)::NUMERIC, 2) FROM combined
UNION ALL SELECT 'customers', ROUND(CORR(customers, total_revenue)::NUMERIC, 2) FROM combined
UNION ALL SELECT 'avg_discount', ROUND(CORR(avg_discount, total_revenue)::NUMERIC, 2) FROM combined
UNION ALL SELECT 'product_breadth', ROUND(CORR(product_breadth, total_revenue)::NUMERIC, 2) FROM combined
UNION ALL SELECT 'customer_retention', ROUND(CORR(customer_retention, total_revenue)::NUMERIC, 2) FROM combined
UNION ALL SELECT 'order_frequency', ROUND(CORR(order_frequency, total_revenue)::NUMERIC, 2) FROM combined
UNION ALL SELECT 'territories', ROUND(CORR(territories, total_revenue)::NUMERIC, 2) FROM combined
ORDER BY pearson_r DESC
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
<summary>Show prompt</summary>

> Total revenue per employee for 1997, ordered by revenue descending.

</details>

<details>
<summary>Show query</summary>

```sql
SELECT
  emp_name.first_name || ' ' || emp_name.last_name AS employee_name,
  ROUND(SUM(ol_price.order_line_unit_price * ol_qty.quantity * (1 - COALESCE(ol_disc.discount, 0)))::numeric, 2) AS total_revenue
FROM daana_dw.order_employee_x oe
JOIN daana_dw.order_desc od
  ON oe.order_key = od.order_key AND od.type_key = 3 AND od.row_st = 'Y'
  AND EXTRACT(YEAR FROM od.sta_tmstp) = 1997
JOIN daana_dw.order_line_order_x olo
  ON oe.order_key = olo.order_key AND olo.type_key = 72 AND olo.row_st = 'Y'
JOIN (
  SELECT order_line_key, val_num AS order_line_unit_price
  FROM (
    SELECT order_line_key, val_num,
      RANK() OVER (PARTITION BY order_line_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.order_line_desc WHERE type_key = 64
  ) a WHERE nbr = 1 AND row_st = 'Y'
) ol_price ON olo.order_line_key = ol_price.order_line_key
JOIN (
  SELECT order_line_key, val_num AS quantity
  FROM (
    SELECT order_line_key, val_num,
      RANK() OVER (PARTITION BY order_line_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.order_line_desc WHERE type_key = 55
  ) a WHERE nbr = 1 AND row_st = 'Y'
) ol_qty ON olo.order_line_key = ol_qty.order_line_key
LEFT JOIN (
  SELECT order_line_key, val_num AS discount
  FROM (
    SELECT order_line_key, val_num,
      RANK() OVER (PARTITION BY order_line_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.order_line_desc WHERE type_key = 62
  ) a WHERE nbr = 1 AND row_st = 'Y'
) ol_disc ON olo.order_line_key = ol_disc.order_line_key
JOIN (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM (
    SELECT employee_key, type_key, val_str,
      RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.employee_desc WHERE type_key IN (63, 10)
  ) a WHERE nbr = 1 AND row_st = 'Y'
  GROUP BY employee_key
) emp_name ON oe.employee_key = emp_name.employee_key
WHERE oe.type_key = 5 AND oe.row_st = 'Y'
GROUP BY emp_name.first_name, emp_name.last_name
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
<summary>Show prompt</summary>

> Number of orders handled per employee in 1997, ordered by count descending.

</details>

<details>
<summary>Show query</summary>

```sql
SELECT
  ed_first.val_str AS first_name,
  ed_last.val_str AS last_name,
  COUNT(DISTINCT rx.order_key) AS order_count
FROM daana_dw.order_employee_x rx
JOIN daana_dw.order_desc od
  ON rx.order_key = od.order_key
  AND od.type_key = 3 AND od.row_st = 'Y'
  AND od.sta_tmstp >= CAST('1997-01-01' AS TIMESTAMP)
  AND od.sta_tmstp < CAST('1998-01-01' AS TIMESTAMP)
JOIN (
  SELECT employee_key, type_key, val_str,
    RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr,
    row_st
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10)
) ed_first
  ON rx.employee_key = ed_first.employee_key
  AND ed_first.type_key = 63 AND ed_first.nbr = 1 AND ed_first.row_st = 'Y'
JOIN (
  SELECT employee_key, type_key, val_str,
    RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr,
    row_st
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10)
) ed_last
  ON rx.employee_key = ed_last.employee_key
  AND ed_last.type_key = 10 AND ed_last.nbr = 1 AND ed_last.row_st = 'Y'
WHERE rx.type_key = 5 AND rx.row_st = 'Y'
GROUP BY ed_first.val_str, ed_last.val_str
ORDER BY order_count DESC
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
<summary>Show prompt</summary>

> Average order size (revenue per order) per employee for 1997, ordered by average descending.

</details>

<details>
<summary>Show query</summary>

```sql
WITH order_revenue AS (
  SELECT
    olox.order_key,
    SUM(
      CASE WHEN old_up.type_key = 64 THEN old_up.val_num END
      * CASE WHEN old_q.type_key = 55 THEN old_q.val_num END
      * (1 - COALESCE(CASE WHEN old_d.type_key = 62 THEN old_d.val_num END, 0))
    ) AS order_total
  FROM daana_dw.order_line_order_x olox
  JOIN (
    SELECT order_line_key, type_key, val_num,
      RANK() OVER (PARTITION BY order_line_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.order_line_desc WHERE type_key IN (64)
  ) old_up ON olox.order_line_key = old_up.order_line_key AND old_up.nbr = 1 AND old_up.row_st = 'Y'
  JOIN (
    SELECT order_line_key, type_key, val_num,
      RANK() OVER (PARTITION BY order_line_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.order_line_desc WHERE type_key IN (55)
  ) old_q ON olox.order_line_key = old_q.order_line_key AND old_q.nbr = 1 AND old_q.row_st = 'Y'
  LEFT JOIN (
    SELECT order_line_key, type_key, val_num,
      RANK() OVER (PARTITION BY order_line_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.order_line_desc WHERE type_key IN (62)
  ) old_d ON olox.order_line_key = old_d.order_line_key AND old_d.nbr = 1 AND old_d.row_st = 'Y'
  WHERE olox.type_key = 72 AND olox.row_st = 'Y'
  GROUP BY olox.order_key
),
order_dates AS (
  SELECT order_key, sta_tmstp AS order_date
  FROM (
    SELECT order_key, sta_tmstp,
      RANK() OVER (PARTITION BY order_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.order_desc WHERE type_key = 3
  ) a WHERE nbr = 1 AND row_st = 'Y'
),
order_employee AS (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
),
employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM (
    SELECT employee_key, type_key, val_str,
      RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr, row_st
    FROM daana_dw.employee_desc WHERE type_key IN (63, 10)
  ) a WHERE nbr = 1 AND row_st = 'Y'
  GROUP BY employee_key
)
SELECT
  en.first_name || ' ' || en.last_name AS employee_name,
  ROUND((SUM(orv.order_total) / COUNT(DISTINCT orv.order_key))::numeric, 2) AS avg_order_size
FROM order_revenue orv
JOIN order_dates od ON orv.order_key = od.order_key
JOIN order_employee oe ON orv.order_key = oe.order_key
JOIN employee_names en ON oe.employee_key = en.employee_key
WHERE EXTRACT(YEAR FROM od.order_date) = 1997
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
<summary>Show prompt</summary>

> Distinct customers served per employee in 1997, ordered by count descending.

</details>

<details>
<summary>Show query</summary>

```sql
SELECT
  ed_fn.val_str || ' ' || ed_ln.val_str AS employee_name,
  COUNT(DISTINCT ocx.customer_key) AS distinct_customers
FROM daana_dw.order_employee_x oex
JOIN daana_dw.order_customer_x ocx
  ON oex.order_key = ocx.order_key
  AND ocx.type_key = 15 AND ocx.row_st = 'Y'
JOIN daana_dw.order_desc od
  ON oex.order_key = od.order_key
  AND od.type_key = 3 AND od.row_st = 'Y'
  AND od.sta_tmstp >= CAST('1997-01-01' AS TIMESTAMP)
  AND od.sta_tmstp < CAST('1998-01-01' AS TIMESTAMP)
JOIN (
  SELECT employee_key, val_str,
    RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
  FROM daana_dw.employee_desc
  WHERE type_key = 63
) ed_fn ON oex.employee_key = ed_fn.employee_key AND ed_fn.nbr = 1
JOIN (
  SELECT employee_key, val_str,
    RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
  FROM daana_dw.employee_desc
  WHERE type_key = 10
) ed_ln ON oex.employee_key = ed_ln.employee_key AND ed_ln.nbr = 1
WHERE oex.type_key = 5 AND oex.row_st = 'Y'
GROUP BY ed_fn.val_str, ed_ln.val_str
ORDER BY distinct_customers DESC
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
<summary>Show prompt</summary>

> Average discount percentage per employee for 1997 order lines, ordered by discount ascending (lowest first).

</details>

<details>
<summary>Show query</summary>

```sql
SELECT
  emp_name.employee_name,
  AVG(ol_disc.discount) AS avg_discount_pct
FROM (
  SELECT order_line_key, val_num AS discount
  FROM daana_dw.order_line_desc
  WHERE type_key = 62 AND row_st = 'Y'
) ol_disc
JOIN (
  SELECT order_line_key, order_key
  FROM daana_dw.order_line_order_x
  WHERE type_key = 72 AND row_st = 'Y'
) olo ON ol_disc.order_line_key = olo.order_line_key
JOIN (
  SELECT order_key, sta_tmstp AS order_date
  FROM (
    SELECT order_key, sta_tmstp,
      RANK() OVER (PARTITION BY order_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.order_desc
    WHERE type_key = 3
  ) a WHERE nbr = 1 AND a.sta_tmstp IS NOT NULL
) od ON olo.order_key = od.order_key
JOIN (
  SELECT order_key, employee_key
  FROM daana_dw.order_employee_x
  WHERE type_key = 5 AND row_st = 'Y'
) oe ON olo.order_key = oe.order_key
JOIN (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) || ' ' || MAX(CASE WHEN type_key = 10 THEN val_str END) AS employee_name
  FROM (
    SELECT employee_key, type_key, val_str,
      RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr,
      row_st
    FROM daana_dw.employee_desc
    WHERE type_key IN (63, 10)
  ) e WHERE nbr = 1 AND row_st = 'Y'
  GROUP BY employee_key
) emp_name ON oe.employee_key = emp_name.employee_key
WHERE EXTRACT(YEAR FROM od.order_date) = 1997
GROUP BY emp_name.employee_name
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
<summary>Show prompt</summary>

> Distinct products sold per employee in 1997, ordered by count descending.

</details>

<details>
<summary>Show query</summary>

```sql
SELECT
  emp_name.first_name,
  emp_name.last_name,
  COUNT(DISTINCT olp.product_key) AS distinct_products_sold
FROM daana_dw.order_employee_x oe
JOIN daana_dw.order_desc od
  ON oe.order_key = od.order_key
  AND od.type_key = 3 AND od.row_st = 'Y'
  AND od.sta_tmstp >= CAST('1997-01-01' AS TIMESTAMP)
  AND od.sta_tmstp < CAST('1998-01-01' AS TIMESTAMP)
JOIN daana_dw.order_line_order_x olo
  ON oe.order_key = olo.order_key
  AND olo.type_key = 72 AND olo.row_st = 'Y'
JOIN daana_dw.order_line_product_x olp
  ON olo.order_line_key = olp.order_line_key
  AND olp.type_key = 28 AND olp.row_st = 'Y'
JOIN (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM (
    SELECT employee_key, type_key, val_str, row_st,
      RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.employee_desc
    WHERE type_key IN (63, 10)
  ) a WHERE nbr = 1 AND row_st = 'Y'
  GROUP BY employee_key
) emp_name ON oe.employee_key = emp_name.employee_key
WHERE oe.type_key = 5 AND oe.row_st = 'Y'
GROUP BY emp_name.first_name, emp_name.last_name
ORDER BY distinct_products_sold DESC
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
<summary>Show prompt</summary>

> Customer retention rate per employee: percentage of 1997 customers who were also served in 1996, ordered by retention descending.

</details>

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM (
    SELECT employee_key, type_key, val_str, row_st,
           RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.employee_desc WHERE type_key IN (63, 10)
  ) a WHERE nbr = 1 AND row_st = 'Y'
  GROUP BY employee_key
),
order_dates AS (
  SELECT order_key, sta_tmstp AS order_date
  FROM (
    SELECT order_key, sta_tmstp, row_st,
           RANK() OVER (PARTITION BY order_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.order_desc WHERE type_key = 3
  ) a WHERE nbr = 1 AND row_st = 'Y'
),
order_employee AS (
  SELECT order_key, employee_key
  FROM (
    SELECT order_key, employee_key, row_st,
           RANK() OVER (PARTITION BY order_key, employee_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.order_employee_x WHERE type_key = 5
  ) a WHERE nbr = 1 AND row_st = 'Y'
),
order_customer AS (
  SELECT order_key, customer_key
  FROM (
    SELECT order_key, customer_key, row_st,
           RANK() OVER (PARTITION BY order_key, customer_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.order_customer_x WHERE type_key = 15
  ) a WHERE nbr = 1 AND row_st = 'Y'
),
customers_1996 AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM order_employee oe
  JOIN order_customer oc ON oe.order_key = oc.order_key
  JOIN order_dates od ON oe.order_key = od.order_key
  WHERE EXTRACT(YEAR FROM od.order_date) = 1996
),
customers_1997 AS (
  SELECT DISTINCT oe.employee_key, oc.customer_key
  FROM order_employee oe
  JOIN order_customer oc ON oe.order_key = oc.order_key
  JOIN order_dates od ON oe.order_key = od.order_key
  WHERE EXTRACT(YEAR FROM od.order_date) = 1997
)
SELECT
  en.first_name || ' ' || en.last_name AS employee_name,
  COUNT(DISTINCT c97.customer_key) AS customers_1997,
  COUNT(DISTINCT CASE WHEN c96.customer_key IS NOT NULL THEN c97.customer_key END) AS retained_from_1996,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN c96.customer_key IS NOT NULL THEN c97.customer_key END)
    / NULLIF(COUNT(DISTINCT c97.customer_key), 0), 1
  ) AS retention_pct
FROM customers_1997 c97
JOIN employee_names en ON c97.employee_key = en.employee_key
LEFT JOIN customers_1996 c96
  ON c97.employee_key = c96.employee_key AND c97.customer_key = c96.customer_key
GROUP BY en.first_name, en.last_name
ORDER BY retention_pct DESC
```

</details>

---

## Order Frequency (Input)

Orders per customer — measures engagement depth.

```
Janet Leverling     1.54  ████████████████████████████████████████
Laura Callahan      1.50  ██████████████████████████████████████
Margaret Peacock    1.42  ████████████████████████████████████
Steven Buchanan     1.38  ███████████████████████████████████
Nancy Davolio       1.38  ███████████████████████████████████
Michael Suyama      1.38  ███████████████████████████████████
Robert King         1.20  ██████████████████████████████
Anne Dodsworth      1.19  █████████████████████████████
Andrew Fuller       1.17  █████████████████████████████
```

<details>
<summary>Show prompt</summary>

> Average number of orders per customer per employee in 1997 (calculated as total distinct orders divided by total distinct customers for each employee), ordered by ratio descending.

</details>

<details>
<summary>Show query</summary>

```sql
WITH employee_names AS (
  SELECT employee_key,
    MAX(CASE WHEN type_key = 63 THEN val_str END) AS first_name,
    MAX(CASE WHEN type_key = 10 THEN val_str END) AS last_name
  FROM (
    SELECT employee_key, type_key, val_str, row_st,
           RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.employee_desc WHERE type_key IN (63, 10)
  ) a WHERE nbr = 1 AND row_st = 'Y'
  GROUP BY employee_key
),
orders_1997 AS (
  SELECT order_key
  FROM (
    SELECT order_key, sta_tmstp, row_st,
           RANK() OVER (PARTITION BY order_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.order_desc WHERE type_key = 3
  ) a WHERE nbr = 1 AND row_st = 'Y'
    AND EXTRACT(YEAR FROM sta_tmstp) = 1997
),
order_employee AS (
  SELECT order_key, employee_key
  FROM (
    SELECT order_key, employee_key, row_st,
           RANK() OVER (PARTITION BY order_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.order_employee_x WHERE type_key = 5
  ) a WHERE nbr = 1 AND row_st = 'Y'
),
order_customer AS (
  SELECT order_key, customer_key
  FROM (
    SELECT order_key, customer_key, row_st,
           RANK() OVER (PARTITION BY order_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr
    FROM daana_dw.order_customer_x WHERE type_key = 15
  ) a WHERE nbr = 1 AND row_st = 'Y'
)
SELECT
  en.first_name || ' ' || en.last_name AS employee_name,
  ROUND(COUNT(DISTINCT o1997.order_key)::numeric / NULLIF(COUNT(DISTINCT oc.customer_key), 0), 2) AS orders_per_customer
FROM orders_1997 o1997
JOIN order_employee oe ON o1997.order_key = oe.order_key
JOIN employee_names en ON oe.employee_key = en.employee_key
JOIN order_customer oc ON o1997.order_key = oc.order_key
GROUP BY en.employee_key, en.first_name, en.last_name
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
<summary>Show prompt</summary>

> Number of territories assigned per employee, ordered by count descending.

</details>

<details>
<summary>Show query</summary>

```sql
SELECT
  MAX(CASE WHEN ed.type_key = 63 THEN ed.val_str END) AS first_name,
  MAX(CASE WHEN ed.type_key = 10 THEN ed.val_str END) AS last_name,
  COUNT(DISTINCT et.territory_key) AS territory_count
FROM daana_dw.employee_territory_x et
JOIN (
  SELECT employee_key, type_key, val_str,
    RANK() OVER (PARTITION BY employee_key, type_key ORDER BY eff_tmstp DESC, ver_tmstp DESC) AS nbr,
    row_st
  FROM daana_dw.employee_desc
  WHERE type_key IN (63, 10)
) ed
  ON et.employee_key = ed.employee_key
  AND ed.nbr = 1 AND ed.row_st = 'Y'
WHERE et.type_key = 26 AND et.row_st = 'Y'
GROUP BY ed.employee_key
ORDER BY territory_count DESC
```

</details>
