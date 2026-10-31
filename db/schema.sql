-- The whole schema. src/dev/reset.ts drops these tables and runs this file.

create table volunteers (
  id         serial primary key,
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table voters (
  id            serial primary key,
  -- The ID from the uploaded file. Re-importing a file updates voters by this key.
  voter_file_id text not null unique,
  first_name    text not null,
  last_name     text not null,
  address       text not null,
  -- Split out of address on import so door lists can be sorted in walk order.
  house_number  integer,
  street        text not null,
  city          text not null,
  zip           text not null,
  precinct      text not null,
  age           integer not null check (age between 18 and 120),
  party         text not null check (party in ('DEM', 'REP', 'NPA', 'OTH')),
  phone         text check (phone ~ '^[0-9]{10}$'),
  -- Modeled 0-100 likelihood of supporting our side, supplied with the file.
  support_score integer not null check (support_score between 0 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index voters_precinct_idx on voters (precinct);

create table lists (
  id           serial primary key,
  name         text not null,
  kind         text not null check (kind in ('phone', 'door')),
  -- The filters that produced this list, kept for reference. Membership is in list_voters.
  segment      jsonb not null,
  volunteer_id integer references volunteers (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- A snapshot of who is on a list, in call or walk order.
create table list_voters (
  list_id  integer not null references lists (id) on delete cascade,
  voter_id integer not null references voters (id) on delete cascade,
  position integer not null,
  primary key (list_id, voter_id)
);

-- One row per attempt. Knocking the same door twice gives two rows.
create table contacts (
  id           serial primary key,
  list_id      integer not null,
  voter_id     integer not null,
  volunteer_id integer references volunteers (id) on delete set null,
  outcome      text not null check (outcome in ('reached', 'not_home', 'moved', 'wrong_number')),
  -- 1 = strong support ... 5 = strong oppose. Only recorded in a conversation.
  support      integer check (support between 1 and 5),
  notes        text,
  created_at   timestamptz not null default now(),
  check (support is null or outcome = 'reached'),
  -- A contact can only be logged for a voter who is on that list.
  foreign key (list_id, voter_id) references list_voters (list_id, voter_id) on delete cascade
);

create index contacts_voter_idx on contacts (voter_id);
