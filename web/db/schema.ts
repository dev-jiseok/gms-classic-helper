import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const playerState = sqliteTable("player_state", {
  ownerId: text("owner_id").primaryKey(), payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1), updatedAt: text("updated_at").notNull(),
});
export const communityPosts = sqliteTable("community_posts", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), room: text("room").notNull(),
  kind: text("kind").notNull(), author: text("author").notNull(), payload: text("payload").notNull(),
  active: integer("active").notNull().default(1), createdAt: text("created_at").notNull(),
  revision: integer("revision").notNull().default(1), updatedAt: text("updated_at").notNull().default(''),
});

export const socialSpaces = sqliteTable('social_spaces', {
  id: text('id').primaryKey(), name: text('name').notNull(), ownerId: text('owner_id').notNull(),
  inviteCode: text('invite_code').notNull().unique(), createdAt: text('created_at').notNull(),
});
export const socialMembers = sqliteTable('social_members', {
  key: text('key').primaryKey(), spaceId: text('space_id').notNull(), userId: text('user_id').notNull(),
  name: text('name').notNull(), role: text('role').notNull().default('member'), joinedAt: text('joined_at').notNull(),
});
export const socialMessages = sqliteTable('social_messages', {
  id: text('id').primaryKey(), room: text('room').notNull(), senderId: text('sender_id').notNull(), recipientId: text('recipient_id').notNull(),
  sender: text('sender').notNull(), recipient: text('recipient').notNull(), subject: text('subject').notNull(), body: text('body').notNull(),
  createdAt: text('created_at').notNull(), readAt: text('read_at'),
});
export const socialRequests = sqliteTable('social_requests', {
  id: text('id').primaryKey(), postId: text('post_id').notNull(), room: text('room').notNull(), userId: text('user_id').notNull(),
  name: text('name').notNull(), note: text('note').notNull(), status: text('status').notNull().default('pending'), createdAt: text('created_at').notNull(),
},table=>[uniqueIndex('social_requests_active_member_unique').on(table.postId,table.userId).where(sql`${table.status} in ('pending','accepted')`)]);
export const sharedTimers = sqliteTable('shared_timers', {
  id: text('id').primaryKey(), room: text('room').notNull(), ownerId: text('owner_id').notNull(), name: text('name').notNull(),
  duration: integer('duration').notNull(), endsAt: integer('ends_at'), updatedAt: text('updated_at').notNull(),
});

export const marketProviderSnapshots = sqliteTable('market_provider_snapshots', {
  providerId: text('provider_id').primaryKey(), payloadJson: text('payload_json').notNull(),
  fetchedAt: text('fetched_at').notNull(), sourceUpdatedAt: text('source_updated_at'),
  nextFetchAt: integer('next_fetch_at').notNull().default(0),
});
export const marketObservations = sqliteTable('market_observations', {
  providerId: text('provider_id').notNull(), itemId: text('item_id').notNull(), type: text('type').notNull(),
  observedAt: text('observed_at').notNull(), unitPrice: real('unit_price').notNull(),
  minimumQuantity: integer('minimum_quantity').notNull(), minimumTotal: real('minimum_total').notNull(),
  optionsJson: text('options_json').notNull(), quantityKnown: integer('quantity_known').notNull(),
  evidenceId: text('evidence_id').notNull(),
}, table=>[
  primaryKey({columns:[table.providerId,table.evidenceId,table.observedAt,table.unitPrice]}),
  index('market_observations_item_type_at').on(table.itemId,table.type,table.observedAt),
  index('market_observations_item_at').on(table.itemId,table.observedAt),
  index('market_observations_at').on(table.observedAt),
]);
