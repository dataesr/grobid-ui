# A Virtual Machine Introspection Based Architecture for Intrusion Detection

**Authors:** Tal Garfinkel, Mendel Rosenblum

## Abstract

Today's architectures for intrusion detection force the IDS designer to make a difficult choice. If the IDS resides on the host, it has an excellent view of what is happening in that host's software, but is highly susceptible to attack. On the other hand, if the IDS resides in the network, it is more resistant to attack, but has a poor view of what is happening inside the host.

**Date:** 2003
**DOI:** 10.1234/example.doi

## 1. Introduction

Intrusion detection systems (IDS) monitor computer systems for signs of security violations. They can be broadly classified into two categories: host-based and network-based systems [[1]][1].

In this paper, we propose a novel architecture that combines the benefits of both approaches using virtual machine introspection.

## 2. Background

Virtual machine monitors (VMMs) provide an isolated execution environment for guest operating systems. This isolation can be leveraged for security purposes.

### 2.1 Virtual Machines

A virtual machine is a software implementation of a machine that executes programs like a physical machine.

## 2.1 Virtual Machines

A virtual machine is a software implementation of a machine that executes programs like a physical machine.

## 3. Architecture

Our architecture consists of three main components:

**Table 1. Results of policy modules against common attacks.**

| Attack Type | Detection Rate | False Positives |
| --- | --- | --- |
| Buffer Overflow | 98.5% | 0.2% |
| Privilege Escalation | 99.1% | 0.1% |

- VMM-based isolation layer
- Introspection engine
- Policy enforcement module

## 4. Evaluation

We evaluated our system using various attack scenarios. The results demonstrate the effectiveness of our approach in detecting intrusions while maintaining low overhead.

The performance overhead was measured at approximately $O = 2.3\%$ for typical workloads.

## References

1. Smith J., "A survey of intrusion detection techniques", *ACM Computing Surveys*, vol. 32, no. 4, pp. 343-396, 2000

## Acknowledgments

We would like to thank our colleagues for their valuable feedback and support during this research.
