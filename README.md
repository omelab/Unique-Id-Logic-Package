# 🧩 @easysofts/id-logic — ID Logic Module for NestJS

A flexible, database-driven **ID generation system** for NestJS using **Sequelize** and **PostgreSQL/MySQL**. 

This module allows you to define **custom ID formats**, supports **daily/monthly/yearly resets**, and can include **dynamic placeholders** such as date and contextual fields (like company code, prefix, etc.).

---

## 🚀 Features

- 🎯 Dynamic ID format using placeholders (`{YYYY}`, `{MM}`, `{DD}`, `{KEY}`, `{#####}`)
- 🔁 Reset sequence daily, monthly, yearly, or by custom token logic
- 📜 Logs every generated ID for tracking
- 🔢 Supports batch generation (multiple IDs at once)
- 🧱 Fully transactional — ensures atomicity
- 🧩 Reusable DynamicModule for easy integration

---

## 📦 Installation 

Install the published package:

```bash
npm i @easysofts/id-logic
# or with yarn
yarn add @easysofts/id-logic
```
Peer / supporting packages (install these if your project doesn't already have them):

```bash
npm i sequelize sequelize-typescript luxon
# If using PostgreSQL
npm i pg
# If using MySQL
npm i mysql2
```

> ⚠️ **@easysofts/id-logic** is a NestJS module and expects **Sequelize** + **sequelize-typescript** configured in your Nest app.

## 🛠️ Quick usage (NestJS)

Add `IdLogicModule` to your `AppModule` (module exported from the package):

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IdLogicModule } from '@easysofts/id-logic'; // <- package import

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadModels: true,
      synchronize: true, // dev only
      logging: false,
    }),

    // register the id-logic module from the package
    IdLogicModule.register(),
  ],
})
export class AppModule {}

```
Then inject the service where needed:

```ts
import { Injectable } from '@nestjs/common';
import { IdLogicService } from '@easysofts/id-logic'; // service export from package

@Injectable()
export class EmployeeService {
  constructor(private readonly idLogicService: IdLogicService) {}

  async createEmployee() {
    const id = await this.idLogicService.generateId({
      slug: 'employee',
      data: { PREFIX: 'EMP', DEPT: 'HR' },
    });
    // use `id`
  }
}

```
 

## ⚙️ Environment Configuration

1️⃣ Create a `.env` file in your project root:

```bash
# .env
APP_PORT=5000
NODE_ENV=development

DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

DB_LOGGING=false
DB_SYNC=true

```


## 🛠️ Database Configuration (Sequelize)

Use the `.env` variables in your `app.module.ts` configuration:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { IdLogicModule } from './id-logic/id-logic.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    SequelizeModule.forRoot({
      dialect: process.env.DB_DIALECT as any,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadModels: true,
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.DB_LOGGING === 'true',
    }),

    // Import the dynamic ID logic module
    IdLogicModule.register(),
  ],
})
export class AppModule {}
```

## 🧩 Model Structure

`sys_unique_id_logics`

Defines the logic and format for generating IDs.

| Field               | Type   | Description                                                |
| ------------------- | ------ | ---------------------------------------------------------- |
| `slug`              | string | Unique key identifying the logic                           |
| `format`            | string | Format pattern, e.g. `{PREFIX}-{YYYY}-{MM}-{#####}`        |
| `reset_type`        | string | `'none'`, `'yearly'`, `'monthly'`, `'daily'`, or `'token'` |
| `token_reset_logic` | string | Comma-separated tokens (`YYYY,MM,DD`)                      |
| `starting_id`       | number | Starting value (default: 1)                                |
| `pad_length`        | number | Length of numeric ID padding (default: 5)                  |


`sys_generated_ids`

Stores every generated ID along with metadata.


| Field             | Type   | Description                         |
| ----------------- | ------ | ----------------------------------- |
| `slug`            | string | Logic slug                          |
| `id_token`        | string | Reset token (combination of fields) |
| `generated_code`  | string | Final generated ID                  |
| `sequence_number` | number | Sequential ID number                |


## 🧰 Example Interface

```ts
// id-logic.interface.ts
export interface IdLogicInterface {
  slug: string;
  data?: Record<string, any>;
  date?: string; // optional ISO date for testing resets
  multiple?: number; // for batch generation
}
```


## ⚙️ Example Service Usage

```ts
import { Injectable } from '@nestjs/common';
import { IdLogicService } from './id-logic/id-logic.service';

@Injectable()
export class EmployeeService {
  constructor(private readonly idLogicService: IdLogicService) {}

  async createEmployee() {
    const generatedId = await this.idLogicService.generateId({
      slug: 'employee',
      data: {
        PREFIX: 'EMP',
        DEPT: 'HR',
      },
    });

    console.log('Generated Employee ID:', generatedId);
  }
}
```

## 🧮 Example Logic Configuration

Insert your logic configuration record in the sys_unique_id_logics table:

| Field             | Example Value                  |
| ----------------- | ------------------------------ |
| slug              | `employee`                     |
| format            | `{PREFIX}-{YYYY}-{MM}-{#####}` |
| reset_type        | `monthly`                      |
| token_reset_logic | `YYYY,MM`                      |
| starting_id       | `1`                            |
| pad_length        | `5`                            |
| active            | `true`                         |


🧩 More Advance Configurations for `sys_unique_id_logics` table:

 
| ID | Slug       | Format                                         | Reset Type | Token Reset Logic     | Next Number | Starting ID | Pad Length | Active | Description                                                                                  |
| -- | ---------- | ---------------------------------------------- | ---------- | --------------------- | ----------- | ----------- | ---------- | ------ | -------------------------------------------------------------------------------------------- |
| 1  | `employee` | `{PREFIX}{CODE}{YYYY}-{MM}-{#####}`            | monthly    | `PREFIX,CODE,YYYY,MM` | 1           | 1           | 5          | true   | Employee IDs include a prefix + internal code, reset monthly. Example: `EMP0012025-11-00001` |
| 2  | `challan`  | `{PREFIX}-{WAREHOUSE}-{YYYY}-{MM}-{#####}`     | monthly    | `YYYY,MM`             | 1           | 1           | 5          | true   | Warehouse challans reset monthly. Example: `CH-WH01-2025-11-00001`                           |
| 3  | `order`    | `{PREFIX}-{DEPT}-{YYYY}-{MM}-{DD}-{#####}`     | daily      | `YYYY,MM,DD`          | 1           | 1           | 6          | true   | Daily order IDs per department. Example: `ORD-HR-2025-11-04-000001`                          |
| 4  | `invoice`  | `{PREFIX}-{CUSTOMER}-{YYYY}-{MM}-{#####}`      | monthly    | `CUSTOMER,YYYY,MM`    | 1           | 1           | 5          | true   | Invoices reset per customer every month. Example: `INV-ACME-2025-11-00001`                   |
| 5  | `shipment` | `{PREFIX}-{REGION}-{YYYY}-{MM}-{DD}-{#####}`   | daily      | `REGION,YYYY,MM,DD`   | 1           | 1           | 5          | true   | Daily shipments per region. Example: `SHIP-NE-2025-11-04-00001`                              |
| 6  | `project`  | `{PREFIX}-{CLIENT}-{YYYY}-{#####}`             | yearly     | `CLIENT,YYYY`         | 1           | 1           | 4          | true   | Projects reset yearly per client. Example: `PRJ-ACME-2025-0001`                              |
| 7  | `ticket`   | `{PREFIX}-{CATEGORY}-{YYYY}-{MM}-{DD}-{#####}` | daily      | `CATEGORY,YYYY,MM,DD` | 1           | 1           | 5          | true   | Support tickets reset daily per category. Example: `TCK-BUG-2025-11-04-00001`                |
| 8  | `asset`    | `{PREFIX}-{TYPE}-{YYYY}-{MM}-{#####}`          | monthly    | `TYPE,YYYY,MM`        | 1           | 1           | 5          | true   | Assets reset monthly per type. Example: `AST-LAP-2025-11-00001`                              |



## 🧩 Example Generated IDs

| Slug       | Format                                         | Reset Type | Token                | Sequence | Generated ID               |
| ---------- | ---------------------------------------------- | ---------- | -------------------- | -------- | -------------------------- |
| `employee` | `{PREFIX}{CODE}{YYYY}-{MM}-{#####}`            | monthly    | `EMP001-2025-11`     | 1        | `EMP0012025-11-00001`      |
| `employee` | `{PREFIX}{CODE}{YYYY}-{MM}-{#####}`            | monthly    | `EMP001-2025-11`     | 2        | `EMP0012025-11-00002`      |
| `employee` | `{PREFIX}{CODE}{YYYY}-{MM}-{#####}`            | monthly    | `EMP001-2025-12`     | 1        | `EMP0012025-12-00001`      |
| `challan`  | `{PREFIX}-{WAREHOUSE}-{YYYY}-{MM}-{#####}`     | monthly    | `CH-WH01-2025-11`    | 1        | `CH-WH01-2025-11-00001`    |
| `challan`  | `{PREFIX}-{WAREHOUSE}-{YYYY}-{MM}-{#####}`     | monthly    | `CH-WH01-2025-11`    | 2        | `CH-WH01-2025-11-00002`    |
| `order`    | `{PREFIX}-{DEPT}-{YYYY}-{MM}-{DD}-{#####}`     | daily      | `ORD-HR-2025-11-04`  | 1        | `ORD-HR-2025-11-04-000001` |
| `order`    | `{PREFIX}-{DEPT}-{YYYY}-{MM}-{DD}-{#####}`     | daily      | `ORD-HR-2025-11-04`  | 2        | `ORD-HR-2025-11-04-000002` |
| `order`    | `{PREFIX}-{DEPT}-{YYYY}-{MM}-{DD}-{#####}`     | daily      | `ORD-HR-2025-11-05`  | 1        | `ORD-HR-2025-11-05-000001` |
| `invoice`  | `{PREFIX}-{CUSTOMER}-{YYYY}-{MM}-{#####}`      | monthly    | `INV-ACME-2025-11`   | 1        | `INV-ACME-2025-11-00001`   |
| `invoice`  | `{PREFIX}-{CUSTOMER}-{YYYY}-{MM}-{#####}`      | monthly    | `INV-ACME-2025-11`   | 2        | `INV-ACME-2025-11-00002`   |
| `shipment` | `{PREFIX}-{REGION}-{YYYY}-{MM}-{DD}-{#####}`   | daily      | `SHIP-NE-2025-11-04` | 1        | `SHIP-NE-2025-11-04-00001` |
| `shipment` | `{PREFIX}-{REGION}-{YYYY}-{MM}-{DD}-{#####}`   | daily      | `SHIP-NE-2025-11-04` | 2        | `SHIP-NE-2025-11-04-00002` |
| `project`  | `{PREFIX}-{CLIENT}-{YYYY}-{#####}`             | yearly     | `PRJ-ACME-2025`      | 1        | `PRJ-ACME-2025-0001`       |
| `project`  | `{PREFIX}-{CLIENT}-{YYYY}-{#####}`             | yearly     | `PRJ-ACME-2025`      | 2        | `PRJ-ACME-2025-0002`       |
| `ticket`   | `{PREFIX}-{CATEGORY}-{YYYY}-{MM}-{DD}-{#####}` | daily      | `TCK-BUG-2025-11-04` | 1        | `TCK-BUG-2025-11-04-00001` |
| `ticket`   | `{PREFIX}-{CATEGORY}-{YYYY}-{MM}-{DD}-{#####}` | daily      | `TCK-BUG-2025-11-04` | 2        | `TCK-BUG-2025-11-04-00002` |
| `asset`    | `{PREFIX}-{TYPE}-{YYYY}-{MM}-{#####}`          | monthly    | `AST-LAP-2025-11`    | 1        | `AST-LAP-2025-11-00001`    |
| `asset`    | `{PREFIX}-{TYPE}-{YYYY}-{MM}-{#####}`          | monthly    | `AST-LAP-2025-11`    | 2        | `AST-LAP-2025-11-00002`    |



### 🔹 Explanation of fields

    - slug → Unique identifier for the ID type
    - format → Template string; placeholders:
        - {PREFIX} → any custom prefix
        - {CODE} → internal code
        - {YYYY}, {YY}, {MM}, {DD} → date parts
        - {#####} → padded sequence number
        - {KEY} → any dynamic key from data object
    - reset_type → Determines how the sequence resets (none, daily, monthly, yearly)
    - token_reset_logic → Fields used to calculate id_token for resets (comma-separated)
    - pad_length → Number of digits in the sequence part
    - next_number / starting_id → Defaults for the sequence counter
    - active → Whether this logic is enabled 


## 🧠 How It Works

    1. The service looks up the logic record by slug.
    2. It builds a token using the data and token_reset_logic (e.g., EMP-HR-2025-11).
    3. It checks sys_generated_ids for the last sequence under that token.
    4. Based on reset_type, it determines if the sequence should restart.
    5. It generates the formatted ID (e.g., EMP-2025-11-00001).
    6. It logs the generated ID in the database.


## 🧪 Example Outputs

| Configuration                       | Output Example         |
| ----------------------------------- | ---------------------- |
| `{PREFIX}-{YYYY}-{#####}`           | `EMP-2025-00001`       |
| `{DEPT}-{YY}-{MM}-{#####}`          | `HR-25-11-00001`       |
| `{PREFIX}-{YYYY}-{MM}-{DD}-{#####}` | `ORD-2025-11-04-00001` |


## 🧱 Example Folder Structure

```bash
src/
 └── id-logic/
      ├── id-logic.module.ts
      ├── id-logic.service.ts
      ├── id-logic.interface.ts
      └── models/
          ├── id-logic.model.ts
          └── generated-id.model.ts
```

## 🧩 DynamicModule Pattern

The IdLogicModule is implemented as a dynamic module for reusability:

```ts
@Module({})
export class IdLogicModule {
  static register(): DynamicModule {
    return {
      module: IdLogicModule,
      imports: [SequelizeModule.forFeature([IdLogic, SysGeneratedId])],
      providers: [IdLogicService],
      exports: [IdLogicService],
    };
  }
}
```
You can import `IdLogicModule.register()` into any other module or microservice.


## 🧰 Example SQL (PostgreSQL)

```sql
CREATE TABLE sys_unique_id_logics (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  format VARCHAR(255) NOT NULL,
  reset_type VARCHAR(50) DEFAULT 'none',
  token_reset_logic VARCHAR(255),
  next_number INT DEFAULT 1,
  starting_id INT DEFAULT 1,
  pad_length INT DEFAULT 5,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE sys_generated_ids (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  id_token VARCHAR(255),
  generated_code VARCHAR(255),
  sequence_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

```

## 📚 Example Generated IDs

| Date       | Token         | Sequence | Generated Code      |
| ---------- | ------------- | -------- | ------------------- |
| 2025-11-04 | `EMP-2025-11` | 1        | `EMP-2025-11-00001` |
| 2025-11-04 | `EMP-2025-11` | 2        | `EMP-2025-11-00002` |
| 2025-12-01 | `EMP-2025-12` | 1        | `EMP-2025-12-00001` |


## 💡 Tips

    - Use {#####} or any number of #s to define padding length (auto-detected from your config).
    - Keep format flexible — any {KEY} in your data object will be replaced dynamically.
    - token_reset_logic helps reset sequences for unique tokens (like per-month or per-branch).
    - Always wrap generateId() inside transactions if combining with your own DB logic.


---

## 🧑‍💻 Author

**Abu Bakar Siddique**  
📧 [a.bakar87@gmail.com](mailto:a.bakar87@gmail.com)

---
