// Item photos live in the "PosImages" Storage bucket (public — reads
// need no policy at all, getPublicUrl bypasses RLS). Uploads are scoped
// to `{account_id}/{filename}` so the bucket's write policies can check
// each writer only ever touches their own folder.
export async function uploadItemImage(supabase, file) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { url: null, error: new Error("Not signed in") }

  const ext = file.name.split(".").pop()
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  // No upsert: every path is a fresh random UUID, so it can never collide,
  // and upsert (INSERT ... ON CONFLICT DO UPDATE) requires satisfying both
  // the INSERT and UPDATE storage policies even when no conflict actually
  // happens — a plain insert only needs the INSERT one.
  const { error: uploadError } = await supabase.storage.from("PosImages").upload(path, file)

  if (uploadError) return { url: null, error: uploadError }

  const { data } = supabase.storage.from("PosImages").getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
