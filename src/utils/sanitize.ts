import { escape, isNumeric } from 'validator';

interface SignUpInput {
  fullname: string;
  email: string;
  country: string;
  state: string;
  phone?: string | null;
  password: string;
  confirm_password: string;
}

interface ProfileInput {
  fullname: string;
  country: string;
  state: string;
}

interface TravelDetailsInput {
  flight_number: string;
  departure_city: string;
  destination_city: string;
  departure_date: string | Date;
  destination_date: string | Date;
  arrival_time: string;
  boarding_time: string;
  airline_name: string;
  item_weight: string | number;
}

export const sanitizeSignUpInput = (input: SignUpInput) => {
  return {
    fullname: escape(input.fullname),
    email: escape(input.email),
    country: escape(input.country),
    state: escape(input.state),
    phone: input.phone && isNumeric(input.phone) ? escape(input.phone) : null,
    password: escape(input.password),
    confirm_password: escape(input.confirm_password)
  };
};

export const sanitizeProfileInput = (input: ProfileInput) => {
  return {
    fullname: escape(input.fullname),
    country: escape(input.country),
    state: escape(input.state)
  };
};

// Escape and sanitize Travel Details fields
export const sanitizedTraveldetails = (input: TravelDetailsInput) => {
  return {
    flight_number: escape(input.flight_number),
    departure_city: escape(input.departure_city),
    destination_city: escape(input.destination_city),
    departure_date: new Date(input.departure_date),
    destination_date: new Date(input.destination_date),
    arrival_time: escape(input.arrival_time),
    boarding_time: escape(input.boarding_time),
    airline_name: escape(input.airline_name),
    item_weight: input.item_weight
  };
};
