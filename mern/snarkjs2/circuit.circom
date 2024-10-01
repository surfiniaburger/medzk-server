pragma circom 2.1.9;

include "poseidon.circom";
include "comparators.circom"; // Includes the necessary circuit for comparison

template HealthRiskAssessment() {
    signal input encryptedRiskScore; // Encrypted risk score (hash of real score)
    signal input realRiskScore; // Actual risk score (plaintext)
    signal input minRisk; // Minimum acceptable risk
    signal input maxRisk; // Maximum acceptable risk
    signal output isInRange; // Output indicating if the risk score is within range

    // Instantiate Poseidon hash
    component poseidonHash = Poseidon(1);

    // Hash the real risk score
    poseidonHash.inputs[0] <== realRiskScore;
    signal decryptedHash;
    decryptedHash <== poseidonHash.out;

    // Check if the decrypted (hashed) value matches the encrypted risk score using quadratic constraints
    signal difference;
    difference <== decryptedHash - encryptedRiskScore;

    // If the difference is 0, the decryption is valid
    signal isValidDecryption;
    isValidDecryption <== 1 - difference * difference; // This will be 1 if valid, 0 otherwise

    // Now check if the realRiskScore is within the acceptable range
    signal inRangeMin;
    inRangeMin <== realRiskScore - minRisk;

    signal inRangeMax;
    inRangeMax <== maxRisk - realRiskScore;

    // Use comparators from circomlib for range checks
    component minComparator = LessThan(64); // LessThan comparator for 64-bit values
    minComparator.in[0] <== minRisk;
    minComparator.in[1] <== realRiskScore;

    component maxComparator = LessThan(64); // LessThan comparator for 64-bit values
    maxComparator.in[0] <== realRiskScore;
    maxComparator.in[1] <== maxRisk;

    signal minCheck;
    minCheck <== minComparator.out;

    signal maxCheck;
    maxCheck <== maxComparator.out;

    // Split the multiplication into two constraints to respect Circom's quadratic constraint rule
    signal isRangeValid;
    isRangeValid <== minCheck * maxCheck;

    isInRange <== isValidDecryption * isRangeValid;
}

component main = HealthRiskAssessment();