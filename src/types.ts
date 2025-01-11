export interface DisplayData {
    // two digits [0, 1]
    hours?: number;
    // two digits [2, 3]
    minutes?: number;
    wind?: {
        // two digits + zero [4, 5]
        heading?: number;
        // two digits [6, 7]
        speed?: number;
        // two digits [20, 21]
        maxSpeed?: number;
        // two digits [44, 45]
        maxPerpendicularSpeed?: number;
    };
    pressure?: {
        // four digits [8, 9, 10, 11]
        hPa?: number;
        // three digits, decimal point + zero [29, 30, 31]
        mmHg?: number;
    };
    clouds?: {
        // one/two digits [12]
        n?: number;
        // one/two digits [19]
        nh?: number;
        // three digits + zero [26, 27, 28]
        height?: number;
    };
    visibility?: {
        // three digits + zero [41, 42, 43]
        s?: number;
        // three digits + zero [32, 33, 34]
        l1?: number;
        // three digits + zero [35, 36, 37]
        l2?: number;
        // three digits + zero [38, 39, 40]
        l3?: number;
    };
    // three digits [13, 14, 15]
    humidity?: number;
    // two digits with sign [16, 17, 18]
    temperature?: number;
    // one sign - [22]
    hasThunder?: boolean;
    // one digit - [23]
    events?: number;
    // one sign - [24] (research more, when 1 - indicator shows nothing)
    isUrgent?: boolean;
    // one digit - [25]
    unitId?: number;
    // one sign - [46]
    hasIcing?: boolean;
}