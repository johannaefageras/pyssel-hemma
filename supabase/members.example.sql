-- The household. Copy this file to members.sql (which git ignores), put in the
-- real names and the email address each person will sign in with, and run it
-- in the Supabase SQL editor after the migration.
--
-- Emails must be lowercase. Each colour can be used once:
-- blue, pink, green, orange, purple, red, brown, light, dark.

insert into public.members (email, name, colour) values
	('johanna@example.com', 'Johanna', 'pink'),
	('boende2@example.com', 'Boende 2', 'blue'),
	('boende3@example.com', 'Boende 3', 'green'),
	('boende4@example.com', 'Boende 4', 'orange'),
	('boende5@example.com', 'Boende 5', 'purple'),
	('boende6@example.com', 'Boende 6', 'brown'),
	('boende7@example.com', 'Boende 7', 'red');

-- Later changes are ordinary SQL, for example:
--   update public.members set name = 'Nytt namn' where email = 'boende2@example.com';
--   delete from public.members where email = 'boende7@example.com';   -- moved out
