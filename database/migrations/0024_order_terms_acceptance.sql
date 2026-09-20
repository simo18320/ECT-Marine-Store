-- Evidence that the customer accepted the terms of sale (and the obligation to pay) at the
-- moment the order was placed — recorded server-side, not just a client-side checkbox.
alter table orders add column terms_accepted_at timestamptz;
