# Benchmarking Core Operations

To understand scaling and cost factors, benchmarks of independent
operations in consistent environments is highly desireable.  The
following document outlines the data that should be collected in
benchmarking, generation of test data, and execution of bennchmarks for
consistent results.

## Data Collected for Comparisons

From each implementation certain core pieces of metadata about the
environment and implementation must be collected for a final benchmark
report:

- `proc` - System Processor Family and Model
- `cores` - Number of Cores
- `mem` - System Memory
- `virt` - Virtualiztion Status [bare metal | containerized | vm]
- `os` - Operating System Family
- `osver` - Operating System Version
- `lang` - Language of Implementation
- `impl` - Implementation or library name
- `alg` - The Algorithm name (e.g. p256)
- `ver` - The version of the implementation
- `method` - Signature method or approach [jws | jws+ld | urdna2015]
- `contact` - Implementer contact information (typically email)

The benchmarks themselves are based on aggregate data from multiple
rounds of operations performed consistently.  Steps are taken (described
in a later part of this document) to minimize impacts from setup and
overhead, as well as to prevent optimization loops from skewing
benchmark results.  The data collected from each round are as follows:

- `test_id` - Unique ID of the test
- `operation` - operation being tested
- `round` - number of the round of executions
- `payload_size` - size of the payload
- `mem_start` - memory at start of round execution
- `mem_end` - memory at end of round execution
- `millis_start` - unix time at start of round execution
- `millis_end` - unix time at end of round execution

## Benchmark Operations

There are four operations that are benchmarked as a part of this overall
test set:

- sign - actual signing of a credential (typically into a Verifiable Credential)
- verify - verification of a signed credential
- signPresentation - creation of a signed Verifiable Presentation
- verifyPresentation - verification of a signed presentation

## Signature Methods

There are three approaches to digital signatures over credentials that
are tested as a part of this benchmark.  Additional methods may be added
at a later date to provide comparisons between different approaches of
providing digital signatures of claims made regarding some subject based
on the Verifiable Credential Core Data Model approach of signing data.
The current methods supported are as follows:

- `jws` - VCs signed and verified according to the [Verifiable
  Credentials with JSON Web
  Signatures](https://transmute-industries.github.io/vc-jws/)
  specification
- `jws+ld` - VCs signed and verified according to the [JSON Web
  Signature 2020](https://w3c.github.io/vc-jws-2020/) specification
- `urdna2015+ALG` - VCs signed and verified according to an algorithm
  and signature suite conforming to the [Verifiable Credential Data
  Integrity](https://w3c.github.io/vc-data-integrity/) specification -
  `ALG` should be replaced with the appropriate name per the
  implementation, e.g. `ed25519`

## Benchmark Runner Method Signatures

### Execution of the benchmark itself

A method matching the following signture and operations should be
exposed via the command line as an executable named: `execute` or
`execute.exe` depending on the platform of execution (*nix vs Wintel)
for any implementer of this benchmark itself.  This is not required for
those wishing to register or test an implementation, solely for those
that may wish to implement the benchmark code itself.

```c
/**
 * Retuns 0 on success, non-zero on error
 */
static int execute(char* pathToTestData, char* metadataFile, char* outputPath) {
    collectMedadata(); // collects environment data that is not noted as user provided above
    // single threaded test
    for (operation in operations) {
        for (int i = 0; i < NUM_RUNS; i++) {
            startStats = getStats()
            operation(pathToTestData)       
            endStats = getStats()
            saveStats(optputPath)
        }
    }
    // multi threaded test
    for (operation in operations) {
        for (int i = 0; i < NUM_RUNS; i++) {
            for (int j = 0; j < NUM_THREADS; j++) {
                submitToThreadPoolExecutor(threadPool, {
                    startStats = getStats()
                    operation(pathToTestData)       
                    endStats = getStats()
                    saveStats(optputPath)
                });
            } 
        }
    }
}
```

### Execution of the Test Data Load Time Test

To account for execution times a few methods must be exposed, not just
for execution of the operations, but also to permit an accounting for
data transfer into memory from the implementation under test.

```c
/**
 * Retuns 0 on success, non-zero on error
 */
static int testLoad(char* pathToTestData) {
    
}
```


## Operation Method Signatures

An implementation wishing to execute this benchmark must implement the
following methods as described below in psuedocode.

### sign

### verify

### signPresentation

### verifyPresentation

## Benchmark Parameters

## Test Data Generation

## Computing Aggregate Results

To compute
