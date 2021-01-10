-- a track has multiple dates


CREATE TABLE dates
(
  date_id SERIAL PRIMARY KEY,
  eventDate DATE NOT NULL
);

CREATE TABLE tracks
(
  id SERIAL PRIMARY KEY,
  date_id INTEGER NOT NULL REFERENCES dates(date_id),
  trackName text NOT NULL
);









-- INSERT INTO firstlast (name_id, firstname, lastname) VALUES
--     ((SELECT name_id FROM names WHERE displayname='dirk'), 'dirk', 'stahlecker');

-- 'psql postgres' to start in command line