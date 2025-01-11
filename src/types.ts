type Maybe<T> = T | null;

export interface DisplayData {
    // two digits [0, 1]
    hours?: Maybe<number>;
    // two digits [2, 3]
    minutes?: Maybe<number>;
    wind?: Maybe<{
        // two digits + zero [4, 5]
        heading?: Maybe<number>;
        // two digits [6, 7]
        speed?: Maybe<number>;
        // two digits [20, 21]
        maxSpeed?: Maybe<number>;
        // two digits [44, 45]
        maxPerpendicularSpeed?: Maybe<number>;
    }>;
    pressure?: Maybe<{
        // four digits [8, 9, 10, 11]
        hPa?: Maybe<number>;
        // three digits, decimal point + zero [29, 30, 31]
        mmHg?: Maybe<number>;
    }>;
    clouds?: Maybe<{
        // one/two digits [12]
        n?: Maybe<number>;
        // one/two digits [19]
        nh?: Maybe<number>;
        // three digits + zero [26, 27, 28]
        height?: Maybe<number>;
    }>;
    visibility?: Maybe<{
        // three digits + zero [41, 42, 43]
        s?: Maybe<number>;
        // three digits + zero [32, 33, 34]
        l1?: Maybe<number>;
        // three digits + zero [35, 36, 37]
        l2?: Maybe<number>;
        // three digits + zero [38, 39, 40]
        l3?: Maybe<number>;
    }>;
    // three digits [13, 14, 15]
    humidity?: Maybe<number>;
    // two digits with sign [16, 17, 18]
    temperature?: Maybe<number>;
    // one sign - [22]
    hasThunder?: Maybe<boolean>;
    // one digit - [23]
    events?: Maybe<number>;
    // one sign - [24] (research more, when 1 - indicator shows nothing)
    isUrgent?: Maybe<boolean>;
    // one digit - [25]
    unitId?: Maybe<number>;
    // one sign - [46]
    hasIcing?: Maybe<boolean>;
}