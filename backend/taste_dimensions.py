"""
Taste Dimension Definitions for TasteGraph

Each dimension represents a spectrum of aesthetic/emotional qualities that transcend
media types. These dimensions are used to create direction vectors in embedding space.
"""

TASTE_DIMENSIONS = [
    {
        "id": "emotional_tone",
        "name": "Emotional Tone",
        "description": "The overall emotional quality and mood of the experience",
        "positive_label": "Light & Joyful",
        "negative_label": "Dark & Melancholic",
        "positive_prompt": (
            "uplifting, joyful, light-hearted, cheerful, optimistic, bright, "
            "sunny, feel-good, heartwarming, delightful, playful, buoyant, "
            "spirited, gleeful, radiant"
        ),
        "negative_prompt": (
            "dark, melancholic, somber, bleak, depressing, gloomy, heavy, "
            "brooding, tragic, mournful, anguished, despairing, haunting, "
            "oppressive, grief-stricken"
        ),
        "examples": {
            "movies": {
                "positive": "Amélie, Paddington, The Grand Budapest Hotel",
                "negative": "Requiem for a Dream, Melancholia, The Road"
            },
            "music": {
                "positive": "Vampire Weekend, ABBA, Pharrell Williams",
                "negative": "Nick Cave, Joy Division, Radiohead (Kid A)"
            },
            "art": {
                "positive": "Claude Monet, David Hockney, Keith Haring",
                "negative": "Caravaggio, Francis Bacon, Goya (Black Paintings)"
            },
            "books": {
                "positive": "The House in the Cerulean Sea, Anne of Green Gables",
                "negative": "The Road, Blood Meridian, Norwegian Wood"
            }
        }
    },
    {
        "id": "energy_intensity",
        "name": "Energy & Intensity",
        "description": "The level of power, force, and energetic engagement",
        "positive_label": "Intense & Powerful",
        "negative_label": "Calm & Gentle",
        "positive_prompt": (
            "intense, powerful, energetic, aggressive, forceful, explosive, "
            "visceral, raw, unrelenting, fierce, vigorous, dynamic, kinetic, "
            "overwhelming, electrifying"
        ),
        "negative_prompt": (
            "calm, gentle, serene, peaceful, quiet, subdued, tranquil, soft, "
            "mellow, restrained, understated, delicate, soothing, placid, "
            "contemplative"
        ),
        "examples": {
            "movies": {
                "positive": "Mad Max: Fury Road, Whiplash, The Raid",
                "negative": "Lost in Translation, My Dinner with André, Paterson"
            },
            "music": {
                "positive": "Rage Against the Machine, Death Grips, The Prodigy",
                "negative": "Bon Iver, Sigur Rós, Max Richter"
            },
            "art": {
                "positive": "Jackson Pollock, Futurism, Neo-Expressionism",
                "negative": "Mark Rothko, Agnes Martin, Japanese Zen paintings"
            },
            "books": {
                "positive": "Blood Meridian, The Iliad, No Country for Old Men",
                "negative": "A Gentleman in Moscow, Stoner, Gilead"
            }
        }
    },
    {
        "id": "complexity",
        "name": "Complexity",
        "description": "The degree of layering, intricacy, and structural sophistication",
        "positive_label": "Complex & Layered",
        "negative_label": "Simple & Minimalist",
        "positive_prompt": (
            "complex, layered, intricate, sophisticated, nuanced, multifaceted, "
            "elaborate, dense, convoluted, rich, textured, deep, labyrinthine, "
            "ornate, baroque"
        ),
        "negative_prompt": (
            "simple, minimalist, straightforward, uncomplicated, direct, clean, "
            "sparse, stripped-down, basic, pure, essential, unadorned, austere, "
            "economical, transparent"
        ),
        "examples": {
            "movies": {
                "positive": "Inception, Primer, Synecdoche New York",
                "negative": "Before Sunrise, Jaws, Die Hard"
            },
            "music": {
                "positive": "Radiohead (OK Computer), Steve Reich, Aphex Twin",
                "negative": "The Ramones, Minimalist techno, Folk simplicity"
            },
            "art": {
                "positive": "Hieronymus Bosch, Baroque art, Takashi Murakami",
                "negative": "Piet Mondrian, Donald Judd, Kazimir Malevich"
            },
            "books": {
                "positive": "Infinite Jest, Ulysses, Cloud Atlas",
                "negative": "The Old Man and the Sea, The Stranger, Hemingway"
            }
        }
    },
    {
        "id": "abstractness",
        "name": "Abstractness",
        "description": "The balance between literal representation and symbolic interpretation",
        "positive_label": "Abstract & Symbolic",
        "negative_label": "Concrete & Literal",
        "positive_prompt": (
            "abstract, symbolic, metaphorical, conceptual, surreal, ambiguous, "
            "enigmatic, dreamlike, impressionistic, non-literal, allegorical, "
            "esoteric, mystical, poetic, transcendent"
        ),
        "negative_prompt": (
            "concrete, literal, realistic, straightforward, explicit, clear, "
            "grounded, tangible, documentary, matter-of-fact, plain, unambiguous, "
            "direct, practical, factual"
        ),
        "examples": {
            "movies": {
                "positive": "The Tree of Life, Mulholland Drive, Holy Motors",
                "negative": "Apollo 13, The Social Network, Spotlight"
            },
            "music": {
                "positive": "Aphex Twin, Brian Eno (ambient), Björk",
                "negative": "Bruce Springsteen, Taylor Swift, Folk storytelling"
            },
            "art": {
                "positive": "Wassily Kandinsky, Mark Rothko, Yves Klein",
                "negative": "Edward Hopper, Norman Rockwell, Photorealism"
            },
            "books": {
                "positive": "The Metamorphosis, Borges, Haruki Murakami",
                "negative": "In Cold Blood, Hillbilly Elegy, Journalism"
            }
        }
    },
    {
        "id": "aesthetic_style",
        "name": "Aesthetic Style",
        "description": "The production quality and stylistic presentation approach",
        "positive_label": "Polished & Refined",
        "negative_label": "Raw & Gritty",
        "positive_prompt": (
            "polished, refined, elegant, sophisticated, pristine, stylized, "
            "ornate, curated, glossy, meticulous, manicured, sleek, luxurious, "
            "sumptuous, immaculate"
        ),
        "negative_prompt": (
            "raw, gritty, rough, unpolished, rough-hewn, lo-fi, scrappy, rugged, "
            "unvarnished, stripped-down, visceral, crude, weathered, DIY, "
            "unfiltered"
        ),
        "examples": {
            "movies": {
                "positive": "Wes Anderson films, Blade Runner 2049, Grand Budapest",
                "negative": "Dogme 95 films, The Blair Witch Project, Tangerine"
            },
            "music": {
                "positive": "Daft Punk (RAM), Orchestral pop, Studio perfection",
                "negative": "Punk rock, Lo-fi hip hop, Garage rock"
            },
            "art": {
                "positive": "Pre-Raphaelites, Hyperrealism, Art Nouveau",
                "negative": "Jean-Michel Basquiat, Street art, Outsider art"
            },
            "books": {
                "positive": "Nabokov, Donna Tartt, Exquisite prose",
                "negative": "Charles Bukowski, Trainspotting, Raw realism"
            }
        }
    },
    {
        "id": "intellectualism",
        "name": "Intellectualism",
        "description": "The degree of cognitive engagement and philosophical depth",
        "positive_label": "Cerebral & Analytical",
        "negative_label": "Intuitive & Visceral",
        "positive_prompt": (
            "cerebral, analytical, thought-provoking, philosophical, intellectual, "
            "contemplative, theoretical, questioning, introspective, heady, "
            "erudite, profound, meditative, scholarly, dialectical"
        ),
        "negative_prompt": (
            "intuitive, visceral, instinctive, emotional, sensory, immediate, "
            "gut-level, primal, spontaneous, unreflective, straightforward, "
            "surface-level, experiential, raw, feeling-driven"
        ),
        "examples": {
            "movies": {
                "positive": "Primer, Arrival, The Man from Earth",
                "negative": "Fast & Furious, Die Hard, Pure action spectacle"
            },
            "music": {
                "positive": "Steve Reich, Minimalist composition, Art music",
                "negative": "EDM, Dance music, Visceral beats"
            },
            "art": {
                "positive": "Conceptual art, Sol LeWitt, Jenny Holzer",
                "negative": "Abstract Expressionism, Impressionism, Intuitive work"
            },
            "books": {
                "positive": "Philosophy, Gravity's Rainbow, Theoretical works",
                "negative": "Beach reads, Thrillers, Pure entertainment"
            }
        }
    },
    {
        "id": "conventionality",
        "name": "Conventionality",
        "description": "The degree of adherence to or departure from established forms",
        "positive_label": "Experimental & Avant-garde",
        "negative_label": "Traditional & Familiar",
        "positive_prompt": (
            "experimental, avant-garde, unconventional, innovative, groundbreaking, "
            "boundary-pushing, radical, challenging, non-traditional, daring, "
            "subversive, transgressive, revolutionary, pioneering, iconoclastic"
        ),
        "negative_prompt": (
            "traditional, conventional, classic, familiar, mainstream, established, "
            "orthodox, time-tested, accessible, standard, safe, typical, "
            "canonical, formulaic, predictable"
        ),
        "examples": {
            "movies": {
                "positive": "Experimental cinema, Lars von Trier, Gaspar Noé",
                "negative": "Classic Hollywood, Marvel films, Traditional narrative"
            },
            "music": {
                "positive": "Noise music, Free jazz, Avant-garde electronic",
                "negative": "Pop music, Classic rock, Traditional structures"
            },
            "art": {
                "positive": "Contemporary art, Installation, Performance art",
                "negative": "Academic painting, Classical sculpture, Renaissance"
            },
            "books": {
                "positive": "Experimental literature, House of Leaves, Finnegans Wake",
                "negative": "Genre fiction, Traditional narrative, Classic novels"
            }
        }
    },
    {
        "id": "worldview",
        "name": "Worldview",
        "description": "The philosophical outlook and perspective on human experience",
        "positive_label": "Hopeful & Optimistic",
        "negative_label": "Cynical & Dark",
        "positive_prompt": (
            "hopeful, optimistic, uplifting, idealistic, affirmative, positive, "
            "inspiring, encouraging, redemptive, life-affirming, warm, generous, "
            "humanistic, compassionate, faith-in-humanity"
        ),
        "negative_prompt": (
            "cynical, pessimistic, nihilistic, bleak, disillusioned, skeptical, "
            "bitter, jaded, despairing, misanthropic, harsh, unforgiving, "
            "fatalistic, grim, world-weary"
        ),
        "examples": {
            "movies": {
                "positive": "It's a Wonderful Life, Ted Lasso, The Martian",
                "negative": "Joker, Requiem for a Dream, Funny Games"
            },
            "music": {
                "positive": "Lizzo, Gospel, Uplifting anthems",
                "negative": "Nine Inch Nails, Black metal, Dystopian themes"
            },
            "art": {
                "positive": "Happiness-themed pop art, Inspirational murals",
                "negative": "Goya's dark works, Dystopian art, Social critique"
            },
            "books": {
                "positive": "The Martian, A Man Called Ove, Hopeful stories",
                "negative": "1984, The Handmaid's Tale, Dystopian fiction"
            }
        }
    }
]


def get_dimension_by_id(dimension_id: str) -> dict:
    """Get a specific dimension by its ID."""
    for dim in TASTE_DIMENSIONS:
        if dim["id"] == dimension_id:
            return dim
    raise ValueError(f"Dimension '{dimension_id}' not found")


def get_all_dimension_ids() -> list[str]:
    """Get list of all dimension IDs."""
    return [dim["id"] for dim in TASTE_DIMENSIONS]


def get_all_dimension_names() -> list[str]:
    """Get list of all dimension names."""
    return [dim["name"] for dim in TASTE_DIMENSIONS]


if __name__ == "__main__":
    # Print summary for verification
    print("TasteGraph Taste Dimensions\n")
    print("=" * 80)
    for i, dim in enumerate(TASTE_DIMENSIONS, 1):
        print(f"\n{i}. {dim['name']} ({dim['id']})")
        print(f"   Spectrum: {dim['negative_label']} ↔ {dim['positive_label']}")
        print(f"   {dim['description']}")
        print(f"\n   Positive: {dim['positive_prompt'][:80]}...")
        print(f"   Negative: {dim['negative_prompt'][:80]}...")
    print("\n" + "=" * 80)
    print(f"\nTotal dimensions: {len(TASTE_DIMENSIONS)}")

