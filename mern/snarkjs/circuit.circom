pragma circom 2.1.9;

template HealthRecordVerification() {
    signal input recordHash; // Hash of the health record
    signal input criteriaHash; // Hash of the criteria
    signal output isValid; // Output indicating if the record meets the criteria

    // Check if the record hash matches the criteria hash using subtraction
    signal diff;
    diff <== recordHash - criteriaHash;

    // If diff is zero, then the hashes are equal, so isValid will be 1; otherwise, 0
    signal isNonZero;
    isNonZero <== diff * diff; // This will be 0 if the difference is 0

    isValid <== 1 - isNonZero; // If isNonZero is 0, isValid is 1; else, it's 0
}

component main = HealthRecordVerification();