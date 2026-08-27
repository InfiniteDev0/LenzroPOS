// Saving an item with its variants is a handful of dependent round trips
// (item -> wipe old variants -> insert new variants -> insert their values,
// each step needing the id the previous step returned) that don't fit
// cleanly as inline page logic.
export async function saveItemWithVariants(supabase, { itemId, payload, variants }) {
  const { data: item, error: itemError } = itemId
    ? await supabase.from("items").update(payload).eq("id", itemId).select().single()
    : await supabase.from("items").insert(payload).select().single();

  if (itemError) return { error: itemError };

  // Replace all variants for this item — simplest correct strategy since
  // nothing else references a variant/value row yet.
  const { error: deleteError } = await supabase
    .from("item_variants")
    .delete()
    .eq("item_id", item.id);
  if (deleteError) return { error: deleteError };

  if (variants.length > 0) {
    const { data: insertedVariants, error: variantsError } = await supabase
      .from("item_variants")
      .insert(variants.map((v) => ({ item_id: item.id, option_name: v.option_name })))
      .select();
    if (variantsError) return { error: variantsError };

    const valuesPayload = insertedVariants.flatMap((row, index) =>
      variants[index].values.map((val) => ({
        variant_id: row.id,
        value: val.value,
        price_override: val.price_override,
      }))
    );

    if (valuesPayload.length > 0) {
      const { error: valuesError } = await supabase
        .from("item_variant_values")
        .insert(valuesPayload);
      if (valuesError) return { error: valuesError };
    }
  }

  return { data: item };
}
