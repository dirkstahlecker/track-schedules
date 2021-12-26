-- a track has multiple dates


-- CREATE TABLE dates
-- (
--   date_id SERIAL PRIMARY KEY,
--   eventDate DATE NOT NULL
-- );

CREATE TABLE dateandtrack
(
  id SERIAL PRIMARY KEY,
  eventDate DATE NOT NULL,
  trackName text NOT NULL,
  state CHAR(2)
);









-- INSERT INTO firstlast (name_id, firstname, lastname) VALUES
--     ((SELECT name_id FROM names WHERE displayname='dirk'), 'dirk', 'stahlecker');

-- 'psql postgres' to start in command line