import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const records=sqliteTable('records',{userId:text('user_id').notNull(),id:text('id').notNull(),data:text('data').notNull(),updatedAt:text('updated_at').notNull() },t=>[primaryKey({columns:[t.userId,t.id]})]);
export const topics=sqliteTable('topics',{userId:text('user_id').notNull(),id:text('id').notNull(),data:text('data').notNull()},t=>[primaryKey({columns:[t.userId,t.id]})]);
export const settings=sqliteTable('settings',{userId:text('user_id').primaryKey(),data:text('data').notNull(),token:text('token')});
export const runs=sqliteTable('runs',{id:text('id').primaryKey(),userId:text('user_id').notNull(),exerciseId:text('exercise_id').notNull(),code:text('code').notNull(),result:text('result').notNull(),createdAt:integer('created_at').notNull()});
