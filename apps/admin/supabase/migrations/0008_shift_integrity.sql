-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Fairness fix: once a shift is closed, its numbers (opening float, cash
-- counted, discrepancy...) must be permanently locked — neither the owner
-- nor the cashier should be able to quietly edit a closed shift's record
-- afterward. Same logic for shift_expenses: an expense can only be logged
-- against a shift that's still open, not backdated onto an already-closed
-- (and already reconciled) one.

drop policy if exists "Account can close own shifts" on public.shifts;
create policy "Account can close own shifts"
  on public.shifts for update
  using (account_id = auth.uid() and status = 'open');

drop policy if exists "Account can log shift expenses" on public.shift_expenses;
create policy "Account can log shift expenses"
  on public.shift_expenses for insert
  with check (
    exists (
      select 1 from public.shifts
      where shifts.id = shift_expenses.shift_id
      and shifts.account_id = auth.uid()
      and shifts.status = 'open'
    )
  );
