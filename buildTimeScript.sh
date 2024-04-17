measure_multiple_times() {
    local command="$1"
    local repetitions="$2"
    local deleted="$3"
    local start_time end_time duration
    echo "Command: $command" >> execution_times.txt
    for ((i = 1; i <= repetitions; i++)); do
        echo "Execution $i:" >> execution_times.txt
        start_time=$(date +%s.%N)
        $command
        end_time=$(date +%s.%N)
        duration=$(echo "scale=3; ($end_time - $start_time) * 1000" | bc)
        echo "Execution time: $duration milliseconds" >> execution_times.txt
        rm -rf deleted
    done
}

# measure_multiple_times "npm run build" 5 .next
