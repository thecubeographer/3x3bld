/* data-letters.js
   The letter-pair image dictionary: 576 words, one for every ordered pair of
   Speffz letters A to X.

   The scheme, so a word is guessable rather than memorised cold:
     1. The word starts with the first letter.
     2. The second letter is the next sound you hear.   DG = DoG,  VP = ViPer
     3. If the second letter is a vowel, the word just starts with both.  BO = BOot
     4. Where no clean single word exists (mostly J, Q, X, V, W) it is a two-word
        image whose initials are the pair.   BJ = Blue Jay,  KQ = King & Queen
     5. Every word is a thing you can see. No abstractions, no word used twice.

   Edit any of these in the app (Letters tab). Your edits are saved locally and
   can be exported to JSON.
*/
window.LETTER_ROWS = {
  A: "Abba, Abs, Ace, Adam, Aeroplane, As F*ck, Agent, Ahab, AI, Ajax, AK-47, Alien, Amber, Anchor, Aorta, Ape, Aquarium, Arrow, Astronaut, Atom, Audi, Avocado, Awning, Axe",
  B: "Bat, Baby, Bacon, Badge, Bed, Buffalo, Bagel, Beehive, Bison, BJ, Bike, Ball, BMW, Bone, Boot, Bell Pepper, BBQ, Bread, Bus, Boat, Bull, Beaver, Bow, Box",
  C: "Cat, Cab, Coconut, CD, Cello, Coffee, Cigar, Chair, Circus, Candy Jar, Cake, Clown, Camel, Cane, Cow, Cop, Croquet, Crown, Castle, Coat, Cup, Cave, Cowboy, Coax Cable",
  D: "Dart, Doberman, Dice, Dad, Deer, Daffodil, Dog, Doghouse, Dinosaur, DJ, Duck, Doll, Diamond, Donut, Door, Diaper, Dairy Queen, Dragon, Desk, Dump Truck, Dust, Dove, Dwarf, Duplex",
  E: "Eagle, Easter Bunny, Echo, Edison, Eel, Eiffel Tower, Egg, Egghead, Einstein, Eject Button, Escape Key, Elbow, Ember, Engine, Eon, Epcot, Equator, Eraser, Escalator, ET, Eucalyptus, Eve, Ewe, Exit Sign",
  F: "Fan, Facebook, Face, Fudge, Feather, Fife, Fig, Fishhook, Fist, Fjord, Fake, FL Studio, Foam, Fangs, Fossil, Fireplace, Frequency Dial, Frog, Fish, Foot, Funnel, Fever, Fireworks, Fox",
  G: "Gator, Goblin, Gecko, Guard, Gem, Giraffe, Goggles, Ghost, Ginger, Grape Juice, Go-Kart, Glass, Gum, Gun, Goat, GoPro, Gay Queer, Grill, Goose, Guitar, Guzzle, Gavel, Gown, Galaxy",
  H: "Hammer, Hobbit, Hockey, Hood, Helmet, Hoof, Hog, Hedgehog, Hippo, Hijab, Hook, Halo, Hammock, Honey, Horse, HP Laptop, Headquarters, Hair, House, Hat, Hut, Hoover, Highway, Hexagon",
  I: "Ice Axe, Ibex, Ice, Idol, Iron Eagle, Iron Fist, Igloo, Ice Hockey, Ice Island, Inkjet, IKEA, Iron Lung, Imp, Ink, Iodine, iPhone, IQ, Iron, Island, It the Clown, Ivory Unicorn, Ivy, Iron Wolf, Inbox",
  J: "Jaguar, Jab, Jacket, Jade, Jelly, Jellyfish, Jug, Jailhouse, Jigsaw, Jujitsu, Jack, Jail, Jam, Jeans, Joker, Jeep, Jonquil, Jar, Jester, Jet, Judge, Javelin, Jaws, Jukebox",
  K: "Kangaroo, Kebab, Ketchup, Kid, Kelp, Knife, Keg, Khaki, Kite, Kanji, Kayak, Kilt, Kimono, Knight, Koala, Keypad, King & Queen, Karate, Kiss, Kettle, Kung Fu, Kevlar, Kiwi, Kleenex",
  L: "Lava, Lab Coat, Lace, Ladder, Leaf, Loaf, Log, Lighthouse, Lizard, Lumberjack, Lock, Lollipop, Lemon, Lion, Lobster, Lamp, Liquor, Laser, Lasso, Lightning, Lung, Lever, Lawnmower, Lynx",
  M: "Mask, Mailbox, Mace, Medal, Melon, Muffin, Magnet, Manhole, Mitten, Mojito, Monkey, Milk, Mummy, Moon, Mouse, Mop, Mosquito, Mirror, Moss, Motor, Mug, Movie Reel, Microwave, Matchbox",
  N: "Nail, Nebula, Necklace, Needle, Nest, Nerf Gun, Nugget, Nighthawk, Nickel, Ninja, Nike, Noodle, Nomad, Nun, No, Napkin, Nun's Quilt, Narwhal, Nose, Nut, Nurse, Navy, Newspaper, Nixon",
  O: "Oats, Obelisk, Octopus, Odin, Owl Egg, Office, Ogre, Ohio, Oil, Orange Juice, OK Sign, Olive, Omelette, Onion, Oolong, Opal, Owl Quill, Orca, Ostrich, Otter, Outlet, Oven, Owl, Ox",
  P: "Panda, Peanut Butter, Pencil, Paddle, Pen, Puffin, Pig, Phone, Pizza, Pajamas, Pickle, Plate, Palm Tree, Piano, Popcorn, Puppy, Poker Queen, Pirate, Pistol, Pool Table, Pumpkin, Prison Van, Powder, Pixel",
  Q: "Quack, Queen Bee, Quiche, Quad, Queen, Queen's Fan, Quagmire, Quahog, Quilt, Queen's Jewel, Quake, Quill, Queen Mary, Quinoa, Quokka, Queen's Pawn, Quiz Queen, QR Code, Quicksand, Quartz, Queue, Quiver, Queen's Wand, Quixote",
  R: "Rat, Rabbit, Racecar, Radio, Reef, Roof, Rug, Rhino, Ring, Rajah, Rocket, Rail, Ram, Rain, Robot, Rope, Racquet, Rolls-Royce, Rose, Rattlesnake, Ruby, RV, Rowboat, Rex",
  S: "Sand, Saber, Scarf, Saddle, Seal, Sofa, Sugar, Shark, Silver, Ski Jump, Skull, Salt, Smoke, Snake, Soap, Spider, Squid, Siren, Scissors, Stone, Sun, Shovel, Sword, Saxophone",
  T: "Taco, Table, Toucan, Toad, Teeth, Tofu, Tiger, Thumb, Tissue, Taj Mahal, Tank, Toilet, Tomato, Tuna, Torch, Teapot, Turquoise, Truck, Toast, Tattoo, Tuba, TV, Towel, Tuxedo",
  U: "UFO Antenna, Umbrella, Unicycle, Udder, Uber Eats, UFO, Ugg Boot, U-Haul, Uranium Ingot, Uncle Joe, Ukulele, Ultrasound, Umpire, Unicorn, USB Outlet, UPS Truck, Unicorn Queen, Urn, USB Stick, Utensil, Umbrella Urn, UV Lamp, Underwear, USB X-ray",
  V: "Vault, Violin Bow, Vacuum, Video Tape, Vest, Velvet Flag, Vegas Sign, Vehicle, Visor, Vinyl Jacket, Viking, Violin, Vampire, Vine, Volcano, Viper, Velvet Quilt, VR Headset, Vase, Vet, Vulture, Volvo, VW Beetle, Vortex",
  W: "Wagon, Web, Watch, Wood, Well, Waffle, Wig, Wheel, Window, Wine Jug, Wok, Wall, Worm, Wine, Wolf, Wasp, Witch Queen, Wire, Whistle, Water, Wurst, Wave, Wigwam, Wax",
  X: "Xanax, Xbox, Xerox Copier, Xylophone Drum, Xenomorph, X-Files, Xmas Gift, X-ray Hand, Xmas Icicle, Xbox Joystick, X-Acto Knife, Xylophone, Xmas, Xenon, Xbox One, Xmas Present, Xylophone Quartet, X-ray, Xmas Stocking, X-ray Tooth, Xenon Underglow, X-ray Vest, X-Wing, XXL Shirt"
};

window.SPEFFZ = "ABCDEFGHIJKLMNOPQRSTUVWX";

/* expand the rows into a flat { AB: "Abs", ... } map */
window.PAIRS = (function () {
  var out = {}, L = window.SPEFFZ;
  for (var i = 0; i < L.length; i++) {
    var row = window.LETTER_ROWS[L[i]].split(',').map(function (s) { return s.trim(); });
    for (var j = 0; j < L.length; j++) out[L[i] + L[j]] = row[j];
  }
  return out;
})();
