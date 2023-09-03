# Getting Started with Create React App

This is a ETHCON Seoul 2023 hackathon project.
We are team 'HANDLIT', and we are going to help people who share their namecard with others. 


## 1. Environment

```
node : v18.14.0
express : 4.17.17
@mtproto/core(telegram)
@unirep/core : 2.0.0-beta-4 
```
The [unirep](https://github.com/Unirep/Unirep) is a solution for prove the data which is how many people they shared their namecard with.
> See: [Users and Attesters](https://developer.unirep.io/docs/protocol/users-and-attesters)

## 2. Architecture
```
Frontend <-> Backend : For User service API
Backend : Node.js <-> Unirep Contract : Data Prove 
Backend : Node.js <-> Unirep Backend : UniRep manage API
```

## 3. Initialization

```shell
yarn install
```

## 4. Start a node

```shell
yarn dev
```

