# ACME ACCOUNTING

Welcome to ACME acounting, this codebase serves as a way for you to
know how we at OSOME work and how you work through challenges while
adopting an existing codebase.

---

There are 3 tasks that you need to do to complete this task, all of them 
must be done for you to move forward.

Keep things elegant, but as simple as possible.

If there are any issues, contact your hiring representative and they 
will clarify it with you.

If you are to use AI/LLM, **DISCLOSE** where and how you used it.

## Context

We have `companies`, companies have `users`.

Every user has a `role`, which defines what this user does in the 
company. There might be multiple users with the same role.

We create `tickets` in a company and assign them to users.

Every ticket has
1. Type - defines the work that should be done by the user
2. Single assignee - the user
3. Category - every type is under a particular category
4. Status - open or resolved

**Endpoints**

- `GET  api/v1/tickets`    - returns all tickets in the system. Without 
                             pagination. This is only for creating logic 
                             testing.
- `POST api/v1/tickets`    - creates a ticket. It accepts `type` and `companyId`
- `GET  api/v1/report`     - starts the processing of existing data and
                             builds a report.        

**Ticket Creation Rules**

If a ticket type is `managementReport`, then the ticket category 
should be `accounting`. The assignee is a user with the role = `Accountant`. 
If there are multiple accountants in the company, 
take the most recently created one.

If a ticket type is `registrationAddressChange`, then the ticket category 
should be `Corporate`. Assignee is a user with the role `Corporate secretary`. 
If there are multiple secretaries, throw an error.

If we cannot find an assignee with the required role, throw an error.

## Tasks

Before working on tasks please clone the repo to your own GitHub account

When done commit the changes and create a PR for the changes in YOUR OWN
repository. Send us a link for review.

### 1. Change requests

This service is old, new business requirements have come in and it
requires us to change the internals of the service.

Let's generate with fixing the behaviour of the service.

**Instructions**

1. When creating a `registrationAddressChange` ticket, if the company 
   already has a ticket with this type, throw a duplication error.
2. Add a new `Director` user role. If we create a `registrationAddressChange`
   ticket, and we cannot find a corporate secretary, assign it to the `Director`. 
   If there are multiple directors, throw an error.

### 2. New ticket

It seems that companies are closing down more than usual, we never considered
this case before. Maybe it's time to add another type of ticket.

**Instructions**

1. Create New Ticket Type
   ```
   {
       "type": "strikeOff",
       "Category": "Management",
       "Assignee": "Director"
   }
   ```

**Side Effects**
- If there are multiple directors, throw an error.
- Resolve all other active tickets in this company (we do not need 
  them anymore as we are closing down the company).

### 3. Optimize

ACME processes tons of data every day. It is essential for us that we
make sure that our internal processes and data are provided accurately
and on time.

We have a legacy service that processes data for us, but it takes a long
time to get the results. Maybe this is a good time to refactor the code.

**Instructions**

1. Optimize the endpoint so that the time it takes to finish an action
   is marginally faster.
2. The endpoint should not hold the connection of the client while processing
   the data in the background.
3. We are looking for performance, not accuracy. If you see numbers not 
   tallying correctly in the report, you may skip it.

**Acceptance**

1. The endpoint should be respond faster than the existing implementation
2. Documents should process in the background and the client should be able
   to check the status of the processing.
3. Metrics should be recorded for discussion.

## Stretch Tasks

There are common principles in the repository that are intentionally 
left out and not covered by the base tasks given above. These are common 
best-practice tasks that you can make in any node project. 

Doing more than what is given above will be plus points and will be
considered in our code review session.

Here are some of the topics you can consider:

- [ ]  Code Quality
- [ ]  Fixing Subtle Errors
- [ ]  Using Tests
- [ ]  Performance Considerations

# Project setup and run

1. NPM
```sh
$ nvm use
$ npm install
```

2. Run the DB container
```sh
docker-compose up -d
```

3. Run migrations
```sh
npm run db:migrate
```

4. Start the server
```sh
npm start
```

5. Go to http://localhost:3000/api/v1/healthcheck 🍾

# Testing
We use the integration tests instead of a unit ones for controllers.
It means we do not mock db requests but perform them on a test db.

To run tests:

1.Run the DB container (if you did not before)
```sh
docker-compose up -d
```

2.Create a db
```sh
npm run db:create:test
```

3. Run migrations
```sh
npm run db:migrate:test
```

4. Test
```sh
npm test
```



<aside>
🔑 Study note on Homework

### 1. `accounts()`

**Purpose:**

Calculates the balance for each account across all CSV files in the tmp directory and writes the results to accounts.csv.

**How it works:**

- Reads all `.csv` files in the tmp directory.
- For each line in each file, extracts the account name, debit, and credit values.
- Sums up (debit - credit) for each account.
- Outputs a CSV file with two columns: `Account,Balance`.

**Input:**

All `.csv` files in the tmp directory (each line: `date,account,desc,debit,credit`).

**Output:**

accounts.csv with content like:

Account,Balance

Cash,1234.56

Sales Revenue,789.00

---

### 2. `yearly()`

**Purpose:**

Calculates the yearly cash balance by summing all transactions for the "Cash" account, grouped by year, and writes the results to yearly.csv.

**How it works:**

- Reads all `.csv` files in the tmp directory (except `yearly.csv`).
- For each line, if the account is "Cash", extracts the year from the date and sums (debit - credit) for that year.
- Outputs a CSV file with two columns: `Financial Year,Cash Balance`.

**Input:**

All `.csv` files in the tmp directory (each line: `date,account,desc,debit,credit`).

**Output:**

yearly.csv with content like:

Financial Year,Cash Balance

2019,1000.00

2020,1500.00

---

### 3. `fs()`

**Purpose:**

Generates a basic financial statement (Income Statement and Balance Sheet) by aggregating balances for predefined accounts, and writes the results to fs.csv.

**How it works:**

- Defines categories for the Income Statement (Revenues, Expenses) and Balance Sheet (Assets, Liabilities, Equity).
- Initializes balances for each account in these categories.
- Reads all `.csv` files in the tmp directory (except `fs.csv`).
- For each line, if the account is in the predefined categories, sums (debit - credit) for that account.
- Calculates totals for each section and outputs a formatted CSV with the financial statement.

**Input:**

All `.csv` files in the tmp directory (each line: `date,account,desc,debit,credit`).

**Output:**

fs.csv with a formatted financial statement, e.g.:

</aside>

How to improve :

- READFILE IN parallel
- **Avoid Repeated File Reads (currenrtly reading all file under tmp 3 times)**
- Add unique id in to each export state
- readFileSync is a blocking operation, blocking all other operation. Update to async reading file operation

For future improvement 

- use readfile stream to handle large file, improve memory
- implement sentry profilling tool
- Add in exeption to handle different cased

Improve perfomance report :

| Prior | Update |
| --- | --- |
| blocking opration | Non blocking read write file operation |
| Keep API connection | release API connection, save export id for future reference  |
| Export time take 9s due to waiting all 3 operation to complete. each take about 3s | Export time take 4s first time making request. Subsequence request take 3s |

Prior update

```json
{
    "accounts.csv": "finished in 4.21",
    "yearly.csv": "finished in 2.76",
    "fs.csv": "finished in 3.24"
}

```

After update



```json
{
    "accounts": "finished in 0.64",
    "yearly": "finished in 0.19",
    "fs": "finished in 0.71"
}
```

```json
{
    "accounts": "finished in 4.36",
    "yearly": "finished in 0.20",
    "fs": "finished in 0.62"
}
```