# Goal
A social website that allows for users to login using their emails then interact with a community of individuals.
The website revolves around a community of "empty nesters" and their journey and experiences post children.

# Details
|Product Requirement|Description|
|----|----|
|GEN-001|The community will work towards achieving badges through a variety of different activities|
|GEN-002|Users can be grouped into "nests" - groups of individuals participating together|
|GEN-003|Users can be linked to partner(s) to identify their immediate family relationship|
|GEN-004|Users and Groups will have dashboards of their historical activities/badges/planned activities|
|GEN-005|An activities dashboard would list a tile view of different things users/groups can participate in|
|GEN-006|Activities are fun things that "empty nesters" can do together and discuss|
|GEN-007|Activities that users either plan/are in progress/or are complete have discussion boards|
|GEN-008|Activities that users either done or abandoned ratings associated with them|
|GEN-000|A complete activity has 2 terminal end points: Done and Abandoned|
|GEN-010|The main landing page of the web site is a prose description of the pivotal moment empty nesters find themselves in|
|GEN-011|Users may post their own testimonials on their profiles and have them either be private or public|
|GEN-012|Public testimonials are available in a Testimonial section as inspiration for all users|
|GEN-013|Public testimonials have to be approved before becoming publically available|
|GEN-014|Private testimonals and be User Private, Family Private, or Group Private to adjust scope of visibility|

# Site
|Product Requirement|Description|
|SIT-001|Website SHOULD have whimsy and cartoon graphics to help provide a welcoming an fun experience|
|SIT-002|Website SHOULD serve as a backend for mobile apps to consume|

# Activities
(Prompt: these are some examples to bootstrap the activities list but the descriptions SHOULD be whimsical and longer)
|Product Requirement|Short|Description|
|----|----|
|ACT-001|Participate in a racket sport league|Join a league for a racketsport: tennis, pickleball, paddle, badminton|
|ACT-002|Group date night|A revolving weekly or bi-weekly date night for the nest with each partner group picking a new location|
|ACT-003|Trivia night|Go to a regular trivia night, don't stop until you place 1st place!|
|ACT-004|Camping adventures|The nest SHOULD plan and go on 3 camping trips together, these can be car camping or backpacking but everyone partner group needs to participate. Partner groups SHOULD divvy up responsibilities for logistics: location, food, activities|

# Technology
|Product Requirement|Description|
|TECH-001|A persistent RDDMS will hold all records of users, histories, profiles, activities, groups, parterships, etc.|
|TECH-002|The RDBMS in production will be highly available and geographically redundant, it will run in AWS RDS|
|TECH-003|The RDBMS SHOULD have a local dev environment that does not depend upon cloud services|
|TECH-004|For web, all modern browers SHOULD be supported, and iOS and Android devices SHOULD be able to use the web experience|
|TECH-005|Native apps for iOS and Android SHOULD be planned but not implemented at this time|

# User Journeys
## Example 1
A user navigates to the web site. They have an entertaining graphic that serves as a backdrop for the main page. Its a comic based art scene of middle aged couples participating in a variety of fun activities. The main page offers a prose description of the philosophical meaning and import of the transition to becoming an "empty nester" and emphasizes the relationships that those partnerships had pre-kids, the importance of raising and loving those children, letting them out into the wide world, and the future relationship that they experience with them after. The site is a comfort for folks wanting to rediscover themselves and their relationships now that they are wholly focused on being a parent. It gives them information on what the empty nester club is and an option to sign up. The sign up process gives them a basic onboarding flow, leverages their email as a means for validating their identity. There is no charge for signing up, there is a package (TBD: this needs to be explored) for providing badges/stickers to each "nest". The user can sign up and add some new emails to their "nest" who will get invite emails with more details about what the Empty Nesters Club is and how to join.


