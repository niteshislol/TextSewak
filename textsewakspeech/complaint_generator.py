import os
import datetime

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def get_input(prompt):
    return input(f"{prompt}: ").strip()

def generate_letter():
    clear_screen()
    print("="*60)
    print("      🔍  LOST ITEM COMPLAINT GENERATOR (HINDI)  🔍")
    print("="*60)
    print("\nPlease provide the following details to generate your letter:\n")

    station_name = get_input("Police Station Name (थाने का नाम)")
    station_address = get_input("Station Address (थाने का पता, District/City)")
    
    user_name = get_input("Your Name (आपका नाम)")
    user_address = get_input("Your Address (आपका पता)")
    
    date_of_incident = get_input("Date of Incident (घटना की तारीख, e.g., 10-01-2026)")
    place_of_incident = get_input("Place of Incident (घटना स्थल)")
    lost_item_name = get_input("Lost Item Name (खोई हुई वस्तु का नाम)")
    lost_item_details = get_input("Item Details (विवरण - color, brand, documents inside, etc.)")
    
    mobile_number = get_input("Your Mobile Number (आपका मोबाइल नंबर)")
    
    current_date = datetime.datetime.now().strftime("%d-%m-%Y")

    letter_template = f"""सेवा में,
श्रीमान थाना प्रभारी महोदय,
{station_name},
{station_address}

विषय: खोई हुई वस्तु ({lost_item_name}) के संबंध में शिकायत पत्र।

महोदय/महोदया,

सविनय निवेदन है कि मैं {user_name}, निवासी {user_address} हूँ। 
दिनांक {date_of_incident} को मैं {place_of_incident} पर {lost_item_name} लेकर जा रहा था/रही थी, 
और रास्ते में वह सामान कहीं गिर गया या खो गया। मैंने उसे ढूँढने की बहुत कोशिश की, 
लेकिन मुझे वह नहीं मिला।

खोये हुए सामान का विवरण निम्नलिखित है:
{lost_item_details}

अतः आपसे विनम्र निवेदन है कि कृपया मेरे खोए हुए सामान की खोजबीन करने में मेरी सहायता करें 
और मेरी शिकायत दर्ज करें।

सधन्यवाद,

{user_name}
मोबाइल: {mobile_number}
दिनांक: {current_date}
"""

    print("\n" + "="*60)
    print("      📄  GENERATED COMPLAINT LETTER (PREVIEW)  📄")
    print("="*60)
    print(letter_template)
    print("="*60)

    save = get_input("\nDo you want to save this to a file? (y/n)")
    if save.lower() == 'y':
        filename = f"complaint_{current_date}_{lost_item_name}.txt".replace(" ", "_")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(letter_template)
        print(f"\n✅ Successfully saved to {filename}")
    
    print("\nThank you for using the Complaint Generator!")

if __name__ == "__main__":
    generate_letter()
