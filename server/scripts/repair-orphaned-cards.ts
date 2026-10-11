/**
 * One-off repair: before column deletion was guarded, removing a column left
 * its cards pointing at an id no board has. They are invisible in the UI but
 * still counted. This moves each one to the end of its board's first column.
 *
 *   npm run repair:orphaned-cards            # report only
 *   npm run repair:orphaned-cards -- --apply # fix
 */
import { connectMongo, disconnectMongo } from "../src/db/mongoose.js";
import { BoardModel, CardModel } from "../src/models/index.js";

const apply = process.argv.includes("--apply");

await connectMongo();
let found = 0;
let unfixable = 0;

for await (const board of BoardModel.find().select("columns name").lean().cursor()) {
  const valid = board.columns.map((c) => c.id);
  const orphans = await CardModel.find({ boardId: board._id, columnId: { $nin: valid } })
    .sort({ order: 1 })
    .select("_id title")
    .lean();
  if (orphans.length === 0) continue;
  found += orphans.length;

  const target = [...board.columns].sort((a, b) => a.order - b.order)[0];
  if (!target) {
    unfixable += orphans.length;
    console.log(`board "${board.name}" has ${orphans.length} orphaned cards and no columns; skipped`);
    continue;
  }
  console.log(`board "${board.name}": ${orphans.length} orphaned -> "${target.name}"`);
  if (!apply) continue;

  const last = await CardModel.findOne({ boardId: board._id, columnId: target.id })
    .sort({ order: -1 })
    .select("order")
    .lean();
  const start = last ? last.order + 1 : 0;
  await CardModel.bulkWrite(
    orphans.map((c, i) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { columnId: target.id, order: start + i } },
      },
    })),
  );
}

console.log(
  apply
    ? `moved ${found - unfixable} cards; ${unfixable} left (boards with no columns)`
    : `${found} orphaned cards found. Re-run with --apply to move them.`,
);
await disconnectMongo();
