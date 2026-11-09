package com.slowspark.user;

import java.util.List;

/** Who a user wants to see in Discover. */
public enum InterestedIn {
    MEN, WOMEN, EVERYONE;

    /** Genders this user wants to see. */
    public List<String> genders() {
        return switch (this) {
            case MEN -> List.of(Gender.MAN.name());
            case WOMEN -> List.of(Gender.WOMAN.name());
            case EVERYONE -> List.of(Gender.MAN.name(), Gender.WOMAN.name(), Gender.NON_BINARY.name());
        };
    }

    /** InterestedIn values of other people who would want to see someone of this gender. */
    public static List<String> acceptingGender(Gender gender) {
        return switch (gender) {
            case MAN -> List.of(MEN.name(), EVERYONE.name());
            case WOMAN -> List.of(WOMEN.name(), EVERYONE.name());
            case NON_BINARY -> List.of(EVERYONE.name());
        };
    }
}
