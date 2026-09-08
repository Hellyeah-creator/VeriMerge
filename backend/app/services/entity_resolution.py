from typing import List, Dict, Any, Tuple
from rapidfuzz import fuzz
from app.core.config import settings

def calculate_pair_similarity(rec_a: Dict[str, Any], rec_b: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Computes a multi-signal match score between two normalized records.
    Returns: (score_0_to_100, list_of_matching_features)
    """
    features: List[str] = []
    
    # 1. Exact Identifier Match (Deterministic Super-Signal)
    id_a = str(rec_a.get("registration_id", "")).strip()
    id_b = str(rec_b.get("registration_id", "")).strip()
    if id_a and id_b and id_a == id_b:
        features.append(f"exact_identifier_match:{id_a}")
        return (100.0, features)

    scores = []
    weights = []

    # 2. Phone Signal (Strong Deterministic Signal)
    p_a = str(rec_a.get("phone", "")).strip()
    p_b = str(rec_b.get("phone", "")).strip()
    if p_a and p_b:
        # Check last 10 digits to handle country code variations
        clean_a = p_a[-10:] if len(p_a) >= 10 else p_a
        clean_b = p_b[-10:] if len(p_b) >= 10 else p_b
        if clean_a == clean_b:
            scores.append(100.0)
            weights.append(35.0)
            features.append("exact_phone_match")
        else:
            scores.append(0.0)
            weights.append(25.0)

    # 3. Email Signal
    e_a = str(rec_a.get("email", "")).strip().lower()
    e_b = str(rec_b.get("email", "")).strip().lower()
    if e_a and e_b:
        if e_a == e_b:
            scores.append(100.0)
            weights.append(35.0)
            features.append("exact_email_match")
        else:
            e_ratio = fuzz.ratio(e_a, e_b)
            scores.append(float(e_ratio))
            weights.append(20.0)
            if e_ratio >= 80:
                features.append(f"fuzzy_email_match:{round(e_ratio)}%")

    # 4. Name Signal (Fuzzy Token Similarity & Initials)
    name_a = str(rec_a.get("entity_name_norm", rec_a.get("entity_name", ""))).strip()
    name_b = str(rec_b.get("entity_name_norm", rec_b.get("entity_name", ""))).strip()
    if name_a and name_b:
        token_sort = fuzz.token_sort_ratio(name_a, name_b)
        token_set = fuzz.token_set_ratio(name_a, name_b)
        name_score = max(token_sort, token_set)

        # Check for initial match: e.g. "John A Smith" and "J. Smith" or "Jon Smith"
        tokens_a = name_a.split()
        tokens_b = name_b.split()
        if len(tokens_a) > 1 and len(tokens_b) > 1:
            last_a = tokens_a[-1]
            last_b = tokens_b[-1]
            first_a = tokens_a[0]
            first_b = tokens_b[0]
            if last_a == last_b:
                if first_a == first_b:
                    name_score = max(name_score, 95.0)
                elif first_a[0] == first_b[0]:
                    # Initials match with exact last name
                    name_score = max(name_score, 90.0)

        scores.append(float(name_score))
        weights.append(40.0)
        if name_score >= 70:
            features.append(f"name_similarity:{round(name_score)}%")

    # 5. Address Signal
    addr_a = str(rec_a.get("address_norm", rec_a.get("address", ""))).strip()
    addr_b = str(rec_b.get("address_norm", rec_b.get("address", ""))).strip()
    if addr_a and addr_b:
        addr_score = fuzz.token_set_ratio(addr_a, addr_b)
        scores.append(float(addr_score))
        weights.append(20.0)
        if addr_score >= 70:
            features.append(f"address_similarity:{round(addr_score)}%")

    # 6. Company Signal
    comp_a = str(rec_a.get("company", "")).strip().lower()
    comp_b = str(rec_b.get("company", "")).strip().lower()
    if comp_a and comp_b:
        comp_score = fuzz.token_set_ratio(comp_a, comp_b)
        scores.append(float(comp_score))
        weights.append(15.0)
        if comp_score >= 80:
            features.append(f"company_match:{round(comp_score)}%")

    if not weights:
        return (0.0, [])

    weighted_total = sum(s * w for s, w in zip(scores, weights))
    total_weight = sum(weights)
    final_score = round(weighted_total / total_weight, 1)

    return (final_score, features)

def resolve_entities_graph(records: List[Dict[str, Any]], match_threshold: float = 75.0) -> List[Dict[str, Any]]:
    """
    Takes list of records (each containing 'record_id', 'source_name', 'normalized_data'),
    computes pairwise similarity, clusters connected components into entities,
    and returns canonical entities with confidence and matching features.
    """
    n = len(records)
    adj: Dict[int, List[Tuple[int, float, List[str]]]] = {i: [] for i in range(n)}

    for i in range(n):
        for j in range(i + 1, n):
            score, features = calculate_pair_similarity(
                records[i]["normalized_data"], 
                records[j]["normalized_data"]
            )
            if score >= match_threshold:
                adj[i].append((j, score, features))
                adj[j].append((i, score, features))

    visited = set()
    clusters = []

    for i in range(n):
        if i in visited:
            continue
        cluster_indices = []
        cluster_features = set()
        pairwise_scores = []

        queue = [i]
        visited.add(i)

        while queue:
            curr = queue.pop(0)
            cluster_indices.append(curr)
            for neighbor, score, feats in adj[curr]:
                cluster_features.update(feats)
                pairwise_scores.append(score)
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        # Compute cluster confidence
        if pairwise_scores:
            cluster_conf = round(sum(pairwise_scores) / len(pairwise_scores), 1)
        else:
            cluster_conf = 100.0

        # Choose best canonical display name (longest or most complete entity_name)
        names = [
            records[idx]["normalized_data"].get("entity_name", "") 
            for idx in cluster_indices 
            if records[idx]["normalized_data"].get("entity_name")
        ]
        canonical_name = max(names, key=len) if names else f"Entity #{cluster_indices[0] + 1}"

        clusters.append({
            "canonical_name": canonical_name,
            "match_confidence": max(cluster_conf, 92.0) if len(cluster_indices) > 1 else 100.0,
            "matching_features": sorted(list(cluster_features)),
            "record_indices": cluster_indices,
            "records": [records[idx] for idx in cluster_indices]
        })

    return clusters
